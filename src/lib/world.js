class Party extends EventEmitter {
	constructor(heroes) {
		super();

		this.heroes = heroes;
	}

	setCell(cell) {
		let last = cell;

		this.heroes.forEach(hero => {
			hero.setCell(last);
			last = hero.prevCell;
		});

		game.world.findByType(InteractiveBeing).forEach(being => {
			if (being.interacting) {
				being.leave();
				being.interacting = false;
			} else {
				if (this.leader.cell.isAdjacent(being.cell)) {
					being.approach();
					being.interacting = true;
				}
			}
		});
	}

	save() {
		return this.heroes.map(hero => hero.save());
	}

	randomHero() {
		return Utils.Random.fromArray(this.heroes);
	}

	get leader() {
		return this.heroes.length > 0 ? this.heroes[0] : null;
	}
}

class Battle extends EventEmitter {
	constructor(world, heroes, enemies) {
		super();

		this.world = world;
		this.heroes = heroes;
		this.enemies = enemies;
		this.creatures = heroes.concat(enemies);

		this.timeline = this.creatures.map(creature => {
			return { creature, count: 0 };
		});

		this.enemies.forEach(enemy => {
			enemy.on('die', () => this.removeEnemy(enemy));
		});
	}

	removeEnemy(enemy) {
		game.world.destroy(enemy);

		this.enemies.splice(this.enemies.indexOf(enemy), 1);
		this.creatures.splice(this.creatures.indexOf(enemy), 1);

		for (let i = 0; i < this.timeline.length; i++) {
			if (this.timeline[i].creature === enemy) {
				this.timeline.splice(i, 1);
			}
		}
	}

	start() {
		this.action();
	}

	next() {
		//this.world.grid.stopHighlightAll();

		if (this.timeline.length > 0) {
			while (true) {
				for (let entity of this.timeline) {
					entity.count += entity.creature.wait;

					if (entity.count >= 100) {
						entity.count = 0;
						//entity.creature.cell.highlight(0xCC4400);

						return entity.creature;
					}
				}
			}
		}

		return null;
	}

	action() {
		if (this.enemies.length === 0) this.victory();
		else if (this.heroes.length === 0) this.defeat();
		else {
			let next = this.next();

			if (next) {
				this.world.view(next.cell);

				next.action(this).then(r => this.action());
			} else {
				// This should never happen.
				console.warn('Somehow ended up in a stuck battle.');
			}
		}
	}

	victory() {
		this.emit('victory');
	}

	defeat() {
		this.emit('defeat');
	}

	randomEnemy() {
		return Utils.Random.fromArray(this.enemies);
	}

	randomHero() {
		return Utils.Random.fromArray(this.heroes);
	}
}

class World extends EventEmitter {
	constructor(scale = 40) {
		super();

		this.STATE_IDLE = 'idle';
		this.STATE_WALKING = 'walking';
		this.STATE_BATTLE = 'battle';

		this.scale = scale;
		this.beings = new List();
		this.graphics = new PIXI.Container();
		this.layers = { };
		this.viewing = null;
		this.setState(this.STATE_IDLE);
		this.party = null;
		this.map = null;
		this.nextBattle = 30;
		this.battle = null;
		this.lastHoverCell = null;

		this.graphics.interactive = true;
		this.graphics.interactiveChildren = true;

		this.graphics.on('click', event => {
			let cell = this.convertMouseEventToCell(event);
			cell && this.handleClick(cell);
		});

		this.graphics.on('mousemove', event => {
			let cell = this.convertMouseEventToCell(event);
			cell && this.handleHover(cell);
		});

		['grid', 'terrain', 'creatures', 'structures', 'ui'].map(name => this.createLayer(name));
	}

	createLayer(name) {
		if (!(name in this.layers)) {
			let layer = new PIXI.Container();

			this.layers[name] = layer;
			this.graphics.addChild(layer);
		} else {
			throw new Error('Layer "' + name + '" already exists.');
		}
	}

	layer(name) {
		if (name in this.layers) {
			return this.layers[name];
		} else {
			throw new Error('Layer "' + name + '" does not exist.');
		}
	}

	setupGrid(width, height, scale) {
		this.grid = new Grid(this, width, height);
		this.layer('grid').addChild(this.grid.createWatermark(scale));
	}

	convertMouseEventToCell(event) {
		// TODO: Potentially need to offset by canvas position.
		// ...

		return this.grid.find(
			event.data.global.x - this.graphics.x,
			event.data.global.y - this.graphics.y,
			DRAW_SCALE
		);
	}

	handleClick(cell) {
		if (this.state === this.STATE_IDLE) {
			if (cell) {
				if (cell.empty) {
					this.grid.stopHighlightAll();
					this.setState(this.STATE_WALKING);

					let path = this.grid.path(this.party.leader.cell, cell).shift();

					path.follow(cell => {
						return new Promise((resolve, reject) => {
							this.party.setCell(cell);
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
					if (cell.content instanceof InteractiveBeing && cell.content.interacting) {
						cell.content.click();
					}
				}
			}

		} else if (this.state === this.STATE_WALKING) {
			// Shouldn't do anything while walking - unless maybe it stops the current walk?
			// ...

		} else if (this.state === this.STATE_BATTLE) {
			// Might want some special actions if in the battle state.
			// ...
		}

		this.emit('interact', cell);
	}

	handleHover(cell) {
		if (this.lastHoverCell) {
			if (this.lastHoverCell !== cell) {
				this.grid.stopHighlightAll();
				game.ui.hideCreatureStatus();

				// Show creature status if hovering.
				if (cell.content instanceof Creature) {
					game.ui.showCreatureStatus(cell.content);
				}

				if (this.state === this.STATE_IDLE) {
					// Highlight path.
					let path = this.grid.path(this.party.leader.cell, cell).shift();
					path.cells.forEach(cell => cell.highlight(0x00FF00, this.scale));
				} else if (this.state === this.STATE_BATTLE) {
					cell.highlight(0xFF0000, this.scale);
				}

				this.emit('hover', cell);
			}
		}

		this.lastHoverCell = cell;
	}

	startBattle() {
		if ('enemies' in this.map && this.map.enemies.length > 0) {
			this.nextBattle = 20 + Math.round(Math.random() * 20);
			this.setState(this.STATE_BATTLE);

			let enemies = [];
			let amount = Math.round(Utils.Random.between(2, 4));

			while (enemies.length < amount) {
				let def = Utils.Random.fromArray(this.map.enemies);
				let cell = this.grid.cluster(this.party.leader.cell, 4).filter(cell => cell.empty).randomCell();
				let enemy = this.create({ type: def.type, x: cell.x, y: cell.y });

				enemies.push(enemy);
			}

			this.battle = new Battle(this, this.party.heroes, enemies);
			this.battle.start();

			this.battle.on('victory', () => {
				console.log('victory');

				this.view(this.party.leader.cell);
				this.battle = null;

				this.setState(this.STATE_IDLE);
			});

			this.emit('startBattle', this.battle);
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
				this.layer(being.layer).addChild(being.graphics);
			}

			this.beings.add(being);

			return being;
		} else {
			throw new Error(`Cannot create Being out of bounds (${def.type} at ${def.x}, ${def.y}).`);
		}
	}

	destroy(being) {
		if (being.graphics && being.graphics.parent) {
			being.graphics.parent.removeChild(being.graphics);
		}

		this.beings.remove(being);
	}

	setupBoundaries(width, height, doors) {
		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				if ((x === 0 || y === 0 || x === width - 1 || y === height - 1) && !this.map.hasDoorAt(x, y)) {
					this.create({ type: 'Wall', x, y });
				}
			}
		}

		doors.forEach(door => this.create({ type: 'Door', x: door.x, y: door.y, destination: door.destination }));
	}

	load(level, party) {
		this.unload();

		// Allow raw JSON strings to be provided.
		if (typeof level === 'string') level = JSON.parse(level);

		if (!('width') in level) throw new Error('Levels must have a width defined.');
		if (!('height') in level) throw new Error('Levels must have a height defined.');

		this.map = new Map(level);

		this.setupGrid(level.width, level.height, this.scale);
		this.setupBoundaries(level.width, level.height, level.doors);

		level.beings.forEach(def => this.create(def));

		let heroes = [];

		party.heroes.forEach(data => {
			heroes.push(this.create({ type: 'Hero', x: party.x, y: party.y, data }));
		});

		this.party = new Party(heroes);
		this.party.setCell(this.party.leader.cell);
		this.view(this.party.leader.cell);

		this.emit('load');
	}

	unload() {
		while (this.beings.items.length > 0) {
			this.destroy(this.beings.items.pop());
		}

		this.layer('grid').removeChildren();
		
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

		this.emit('cameraMoved', cell);
	}

	findByType(type) {
		return this.beings.items.filter(being => being instanceof type);
	}

	setState(state) {
		this.state = state;
		this.emit('state', state);
	}
}

class Map {
	constructor(data) {
		this.data = data;
	}

	hasDoorAt(x, y) {
		for (let door of this.data.doors) {
			if (door.x === x && door.y === y) return true;
		}

		return false;
	}

	get enemies() {
		return this.data.enemies;
	}
}