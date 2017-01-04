class Party extends EventEmitter {
	constructor(heroes) {
		super();

		this.heroes = heroes;
	}

	randomHero() {
		if (this.heroes.length > 0) {
			return this.heroes[Math.floor(Math.random() * this.heroes.length)];
		}

		return null;
	}

	get leader() {
		return this.heroes.length > 0 ? this.heroes[0] : null;
	}
}

class World extends EventEmitter {
	constructor(width, height, scale = 40) {
		super();

		this.STATE_IDLE = 'idle';
		this.STATE_WALKING = 'walking';
		this.STATE_BATTLE = 'battle';

		this.scale = scale;
		this.beings = new List();
		this.graphics = new PIXI.Container();
		this.viewing = null;
		this.setState(this.STATE_IDLE);
		this.party = null;
		this.level = null;
		this.nextBattle = 10;
		this.enemies = [];
	}

	setupGrid(width, height, scale) {
		this.grid = new Grid(this, width, height);

		let light = true;

		for (let x = 0; x < width; x++ ) {
			for (let y = 0; y < height; y++) {
				let box = new PIXI.Graphics();

				box.beginFill(light ? 0x666666 : 0x606060);
				box.drawRect(0, 0, scale, scale);
				box.position.set(x * scale, y * scale);
				box.endFill();

				this.graphics.addChild(box);

				light = !light;
			}

			if (height % 2 === 0) light = !light;
		}
	}

	handleClick(cell) {
		if (this.state === this.STATE_IDLE) {
			if (cell) {
				if (cell.empty) {
					this.setState(this.STATE_WALKING);

					let path = this.grid.path(this.party.leader.cell, cell).shift();

					path.follow(cell => {
						return new Promise((resolve, reject) => {
							this.party.leader.setCell(cell);
							this.view(cell);

							this.nextBattle -= 1;

							if (this.nextBattle <= 0) {
								reject(true);
							} else {
								setTimeout(resolve.bind(), 80);
							}
						});

					}).then(battle => {
						if (battle) this.startBattle();
						else this.setState(this.STATE_IDLE);
					});
				} else {
					// Interact with cell.
					this.emit('interact', cell);
				}
			}
		} else if (this.state === this.STATE_WALKING) {
			// Shouldn't do anything while walking - unless maybe it stops the current walk?
			// ...
		} else if (this.state === this.STATE_BATTLE) {
			// Might want some special actions if in the battle state.
			// ...
		}
	}

	startBattle() {
		if ('enemies' in this.level && this.level.enemies.length > 0) {
			this.nextBattle = 20 + Math.round(Math.random() * 20);
			this.setState(this.STATE_BATTLE);

			this.enemies = [];

			let amount = Math.round(Utils.Random.between(2, 4));

			while (this.enemies.length < amount) {
				let def = Utils.Random.fromArray(this.level.enemies);
				let cell = this.grid.cluster(this.party.leader.cell, 4).filter(cell => cell.empty).randomCell();

				console.log(cell);

				let enemy = this.create({ type: def.type, x: cell.x, y: cell.y });

				this.enemies.push(enemy);
			}

			console.log('To battle!');
		} else {
			// No enemies to spawn, do nothing.
			// ...
		}
	}

	/**
	 * Creates a new Being in this world using a provided definition.
	 * 
	 * @param {Object} def The definition for the Being to create. At minimum this must provide the
	 * fields "type", "x" and "y".
	 * 
	 * @return {Being}
	 * 
	 * @throws {Error} If any required fields are missing.
	 * @throws {Error} If the type does not exist.
	 * @throws {Error} If the x and y values provided are out of bounds for the current level.
	 */
	create(def) {
		if (!('type' in def)) throw new Error('Definition is missing "type".');
		if (!('x' in def)) throw new Error('Definition is missing "x".');
		if (!('y' in def)) throw new Error('Definition is missing "y".');

		if (!(def.type in beings)) throw new Error(`Unknown Being type "${def.type}".`);

		let cell = this.grid.find(def.x, def.y);

		if (cell) {
			let being = new beings[def.type](this, cell, def);

			if (being.graphics) {
				this.graphics.addChild(being.graphics);
			}

			this.beings.add(being);

			return being;
		} else {
			throw new Error(`Cannot create Being out of bounds (${def.type} at ${def.x}, ${def.y}).`);
		}
	}

	destroy(being) {
		if (being.graphics) {
			being.graphics.parent === this.graphics && this.graphics.removeChild(being.graphics);
		}

		this.beings.remove(being);
	}

	load(level, party) {
		this.unload();

		// Allow raw JSON strings to be provided.
		if (typeof level === 'string') level = JSON.parse(level);

		this.level = level;
		this.setupGrid(level.width, level.height, this.scale);

		level.beings.forEach(def => this.create(def));

		let heroes = [];

		party.heroes.forEach(data => {
			heroes.push(this.create({ type: 'Hero', x: party.x, y: party.y, data }));
		});

		this.party = new Party(heroes);
		this.view(this.party.leader.cell);

		this.emit('load');
	}

	unload() {
		this.beings.items.forEach(being => this.destroy(being));
		this.emit('unload');
	}

	save() {
		return {
			width: this.grid.width,
			height: this.grid.height,
			beings: this.beings.items.map(being => being.save()).filter(def => def !== null)
		};
	}

	update() {
		this.beings.items.forEach(being => being.update());
	}

	view(cell) {
		this.viewing = cell;

		this.graphics.x = -cell.x * this.scale + (GAME_WIDTH / 2) - (this.scale / 2);
		this.graphics.y = -cell.y * this.scale + (GAME_HEIGHT / 2) - (this.scale / 2);

		if (this.graphics.x > 0) this.graphics.x = 0;
		if (this.graphics.y > 0) this.graphics.y = 0;
		if (this.graphics.x + this.graphics.width < GAME_WIDTH) this.graphics.x = GAME_WIDTH - this.graphics.width;
		if (this.graphics.y + this.graphics.height < GAME_HEIGHT) this.graphics.y = GAME_HEIGHT - this.graphics.height;
	}

	findByType(type) {
		return this.beings.items.filter(being => being instanceof type);
	}

	setState(state) {
		this.state = state;
		this.emit('state', state);
	}
}