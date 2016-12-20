class Being {
	constructor(world, cell) {
		this.world = world;
		this.cell = cell;
		this.prevCell = null;
		this.graphics = null;
		this.walkable = true;
	}

	setCell(cell) {
		if (this.graphics) {
			this.graphics.x = cell.x * this.world.scale;
			this.graphics.y = cell.y * this.world.scale;
		}

		this.prevCell = this.cell;
		this.cell = cell;
	}

	update() {
		//
	}
}

class Wall extends Being {
	constructor(world, cell) {
		super(world, cell);

		this.walkable = false;

		this.graphics = new PIXI.Graphics();
		this.graphics.beginFill(0x111111);
		this.graphics.drawRect(0, 0, world.scale, world.scale);
		
		this.setCell(cell);
	}
}

class Creature extends Being {
	constructor(world, cell) {
		super(world, cell);

		this.stats = {
			health: 1,
			maxhealth: 1
		};
	}
}

class Hero extends Creature {
	constructor(world, cell) {
		super(world, cell);

		this.graphics = new PIXI.Graphics();
		this.graphics.beginFill(Math.random() * 0x444444);
		this.graphics.drawRect(0, 0, world.scale, world.scale);
		this.graphics.endFill();

		this.setCell(cell);
	}
}

class Enemy extends Creature {
	constructor(world, cell) {
		super(world, cell);

		this.cooldown = 4;
		this.maxCooldown = 4;

		this.movement = 2;

		world.on('playerMoved', () => {
			this.cooldown -= 1;

			if (this.cooldown <= 0) {
				this.action();
				this.cooldown = this.maxCooldown;
				this.world.emit('startActing', this);
			}
		});
	}

	action() {
		this.world.emit('endActing', this);
		console.log('Some action.');
	}
}

class Skeleton extends Enemy {
	constructor(world, cell) {
		super(world, cell);

		this.graphics = new PIXI.Graphics();
		this.graphics.beginFill(0x00CC22);
		this.graphics.drawRect(0, 0, world.scale, world.scale);
		this.graphics.endFill();

		this.setCell(cell);
	}

	action() {
		let path = this.world.grid.path(this.cell, this.world.party.leader.cell, true);
		path.cells = path.cells.slice(0, this.movement);

		path.follow(cell => {
			this.setCell(cell);
		}, 80).then(() => this.world.emit('endActing', this));
	}
}

const beings = {
	Wall, Hero, Skeleton
};

class Path {
	constructor(cells) {
		this.cells = cells;
	}

	follow(callback, delay) {
		return new Promise((resolve, reject) => {
			let interval = setInterval(() => {
				if (this.cells.length > 0) {
					callback(this.cells.shift());
				} else {
					clearInterval(interval);
					resolve();
				}
			}, delay);
		});
	}
}

class Grid {
	constructor(world, width, height) {
		this.world = world;
		this.width = width;
		this.height = height;
		this.finder = new PF.AStarFinder();
		this.cells = [];

		for (let y = 0; y < height; y++) {
			this.cells[y] = [];

			for (let x = 0; x < width; x++) {
				this.cells[y][x] = new Cell(this, x, y);
			}
		}
	}

	find(x, y, scale = 1) {
		x = Math.floor(x / scale);
		y = Math.floor(y / scale);

		if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
			console.warn('Trying to get an out of bounds cell (' + x + ', ' + y + ').');
			return null;
		}

		return this.cells[y][x];
	}

	path(start, end, trimFirst = false) {
		let nodes = new PF.Grid(this.width, this.height);

		this.world.beings.items.forEach(being => {
			if (!being.walkable) {
				nodes.setWalkableAt(being.cell.x, being.cell.y, false);
			}
		});

		let path = new Path(this.finder.findPath(start.x, start.y, end.x, end.y, nodes).map(coords => this.find(coords[0], coords[1])));

		if (trimFirst) path.cells = path.cells.splice(1);

		return path;
	}
}

class Cell {
	constructor(grid, x, y) {
		this.grid = grid;
		this.x = x;
		this.y = y;
	}

	get content() {
		let result = null;

		this.grid.world.beings.items.forEach(being => {
			if (being.cell === this) result = being;
		});

		return result;
	}
}

class Party {
	constructor(heroes) {
		this.heroes = heroes;
	}

	moveTo(cell) {
		let last = null;

		this.heroes.forEach(hero => {
			if (last === null) {
				hero.setCell(cell);
			} else {
				if (last.prevCell) {
					hero.setCell(last.prevCell);
				}
			}

			last = hero;
		});
	}

	get leader() {
		return this.heroes.length > 0 ? this.heroes[0] : null;
	}

	get followers() {
		return this.heroes.filter(hero => hero !== this.leader);
	}
}

class World extends EventEmitter {
	constructor(width, height, scale = 40) {
		super();

		this.STATE_IDLE = 'idle';
		this.STATE_WALKING = 'walking';
		this.STATE_ENEMY = 'enemy';

		this.scale = scale;
		this.beings = new List();
		this.graphics = new PIXI.Container();
		this.viewing = null;
		this.setState(this.STATE_IDLE);
		this.party = null;

		this.on('startActing', being => {
			this.setState(this.STATE_ENEMY);
		});

		this.on('endActing', being => {
			this.setState(this.STATE_IDLE);
		});
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

	handleClick(x, y) {
		if (this.state === this.STATE_IDLE) {
			let cell = this.grid.find(x - this.graphics.x, y - this.graphics.y, this.scale);

			if (cell) {
				this.setState(this.STATE_WALKING);

				let path = this.grid.path(this.party.leader.cell, cell, true);

				path.follow(cell => {
					this.party.moveTo(cell);
					this.view(cell);
					this.emit('playerMoved', cell);
				}, 80).then(() => this.setState(this.STATE_IDLE));
			}
		} else {
			// Walking, probably.
		}
	}

	create(type, cell) {
		let being = new type(this, cell);

		if (being.graphics) {
			this.graphics.addChild(being.graphics);
		}

		this.beings.add(being);

		return being;
	}

	destroy(being) {
		if (being.graphics) {
			being.graphics.parent === this.graphics && this.graphics.removeChild(being.graphics);
		}

		this.beings.remove(being);
	}

	load(level, party) {
		this.unload();

		if (typeof level === 'string') {
			level = JSON.parse(level);
		}

		this.setupGrid(level.width, level.height, this.scale);

		level.beings.forEach(def => {
			let pos = this.grid.find(def.x, def.y);

			if (pos) this.create(beings[def.type], pos);
			else console.warn('Cannot load beings out of bounds, ignoring (' + def.type + ' at ' + def.x + ', ' + def.y + ').');
		});

		let heroes = [];

		party.heroes.forEach(def => {
			heroes.push(this.create(Hero, this.grid.find(party.x, party.y)));
		});

		this.party = new Party(heroes);

		this.view(this.hero.cell);

		this.emit('load');
	}

	unload() {
		this.beings.items.forEach(being => this.destroy(being));
		this.emit('unload');
	}

	update() {
		this.beings.items.forEach(being => being.update());
	}

	view(cell) {
		this.viewing = cell;

		this.graphics.x = -cell.x * this.scale + (renderer.width / 2) - (this.scale / 2);
		this.graphics.y = -cell.y * this.scale + (renderer.height / 2) - (this.scale / 2);

		if (this.graphics.x > 0) this.graphics.x = 0;
		if (this.graphics.y > 0) this.graphics.y = 0;
		if (this.graphics.x + this.graphics.width < renderer.width) this.graphics.x = renderer.width - this.graphics.width;
		if (this.graphics.y + this.graphics.height < renderer.height) this.graphics.y = renderer.height - this.graphics.height;
	}

	findByType(type) {
		return this.beings.items.filter(being => being instanceof type);
	}

	setState(state) {
		this.state = state;
		this.emit('state', state);
	}

	get hero() { return this.findByType(Hero)[0]; }
}