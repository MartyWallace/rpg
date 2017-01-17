class Party extends EventEmitter {
	constructor(heroes) {
		super();

		this.heroes = heroes;
	}

	moveToCell(cell, duration = 0) {
		return new Promise((resolve, reject) => {
			let last = cell;
			let moves = [];

			this.heroes.forEach(hero => {
				moves.push(hero.moveToCell(last, duration, 'linear'));
				last = hero.prevCell;
			});
			
			Promise.all(moves).then(cells => {
				game.world.alertInteractiveBeings(cell);
				resolve(cell);
			});
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
		this.nextBattle = 9;
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
		let x = event.data.global.x - this.graphics.x;
		let y = event.data.global.y - this.graphics.y;

		if (this.grid && this.grid.isWithin(x, y, DRAW_SCALE)) {
			return this.grid.find(x, y, DRAW_SCALE);
		}

		return null;
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
							this.view(cell, 200);
							this.party.moveToCell(cell, 200).then(cell => {
								// Only count down if there are enemies for this area. If there
								// are no enemies listed, this area is "safe" (probably a town or
								// similar).
								if (this.map.enemies.length > 0) {
									this.nextBattle -= 1;
								}

								if (this.nextBattle <= 0) reject(true);
								else resolve();
							});
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

	alertInteractiveBeings(cell) {
		this.findByType(InteractiveBeing).forEach(being => {
			if (being.interacting) {
				being.leave();
				being.interacting = false;
			} else {
				if (this.party.leader.cell.isAdjacent(being.cell)) {
					being.approach();
					being.interacting = true;
				}
			}
		});
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

			this.battle.on('victory', result => {
				game.ui.showVictoryScreen(result).then(() => {
					this.view(this.party.leader.cell, 300);
					this.battle = null;

					this.setState(this.STATE_IDLE);
				});
			});

			this.battle.on('defeat', () => {
				window.alert('Game Over.');
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
			let being = new beings[def.type](cell, def);

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
		/*
		for (let x = 0; x < width; x++) {
			for (let y = 0; y < height; y++) {
				if ((x === 0 || y === 0 || x === width - 1 || y === height - 1) && !this.map.hasDoorAt(x, y)) {
					this.create({ type: 'Wall', x, y });
				}
			}
		}
		*/

		doors.forEach(door => this.create({ type: 'Door', x: door.x, y: door.y, destination: door.destination }));
	}

	load(level, party) {
		game.ui.transition(200).then(() => {
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
			this.alertInteractiveBeings(this.party.leader.cell);

			this.view(this.party.leader.cell);
			this.emit('load');
		});
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

	/**
	 * Move a new cell into the center of the camera.
	 * 
	 * @param {Cell} cell The cell to look at.
	 * @param {Number} duration The time to spend tweening the camera to the target cell.
	 * @param {String} ease The ease function to use when moving the camera.
	 * @param {Boolean} clamp Whether the camera view should be clamped within the world or not.
	 */
	view(cell, duration = 0, ease = 'sineInOut', clamp = false) {
		return new Promise((resolve, reject) => {
			if (this.viewing === cell) {
				// If we're already looking at the target cell, resolve immediately.
				resolve(cell);
			} else {
				let targetX = -cell.x * this.scale + (game.width / 2) - (this.scale / 2);
				let targetY = -cell.y * this.scale + (game.height / 2) - (this.scale / 2);

				if (clamp) {
					targetX = Utils.Math.clamp(targetX, game.width - this.width, 0);
					targetY = Utils.Math.clamp(targetY, game.height - this.height, 0);
				}

				createjs.Tween.get(this.graphics).to({ x: targetX, y: targetY }, duration, createjs.Ease[ease]).call(() => {
					this.viewing = cell;
					resolve(cell);
				});
			}
		});
	}

	findByType(type) {
		return this.beings.items.filter(being => being instanceof type);
	}

	setState(state) {
		this.state = state;
		this.emit('state', state);
	}

	get width() { return this.grid.width * this.scale; }
	get height() { return this.grid.height * this.scale; }
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