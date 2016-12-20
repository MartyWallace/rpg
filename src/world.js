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
		this.graphics.beginFill(0x333333);
		this.graphics.drawRect(0, 0, world.scale, world.scale);
		
		this.setCell(cell);
	}
}

class Mobile extends Being {
	//
}

class Hero extends Mobile {
	constructor(world, cell) {
		super(world, cell);

		this.graphics = new PIXI.Graphics();
		this.graphics.beginFill(Math.random() * 0x444444);
		this.graphics.drawRect(0, 0, world.scale, world.scale);
		this.graphics.endFill();

		this.setCell(cell);
	}
}

const beings = {
	Wall, Hero
};

class Grid {
	constructor(world, width, height) {
		this.world = world;
		this.width = width;
		this.height = height;
		this.finder = new PF.AStarFinder();
		this.cells = [];

		for (let y = 0; y < height; y++) {
			this.cells[y] = [];

			for (let x = 0; x < height; x++) {
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

	path(start, end) {
		let nodes = new PF.Grid(this.width, this.height);

		this.world.beings.items.forEach(being => {
			if (!being.walkable) {
				nodes.setWalkableAt(being.cell.x, being.cell.y, false);
			}
		});

		return this.finder.findPath(start.x, start.y, end.x, end.y, nodes).map(coords => this.find(coords[0], coords[1]));
	}
}

class Cell {
	constructor(grid, x, y) {
		this.grid = grid;
		this.x = x;
		this.y = y;
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

		this.scale = scale;
		this.beings = new List();
		this.graphics = new PIXI.Container();
		this.viewing = null;
		this.state = this.STATE_IDLE;
		this.party = null;
	}

	setupGrid(width, height, scale) {
		this.grid = new Grid(this, width, height);

		let light = true;

		for (let x = 0; x < width; x++ ) {
			for (let y = 0; y < height; y++) {
				let box = new PIXI.Graphics();
				box.beginFill(light ? 0xDDDDDD : 0xCCCCCC);
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
				this.state = this.STATE_WALKING;

				let path = this.grid.path(this.party.leader.cell, cell).filter(cell => cell !== this.party.leader.cell);

				let interval = setInterval(() => {
					if (path.length > 0) {
						let cell = path.shift();
						this.party.moveTo(cell);
						this.view(cell);
					} else {
						clearInterval(interval);
						this.state = this.STATE_IDLE;
					}
				}, 80);
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
			this.create(beings[def.type], this.grid.find(def.x, def.y));
		});

		let heroes = [];

		party.heroes.forEach(def => {
			heroes.push(this.create(Hero, this.grid.find(party.x, party.y)));
		});

		this.party = new Party(heroes);
		console.log(this.party);

		this.view(this.hero.cell);
	}

	unload() {
		this.beings.items.forEach(being => this.destroy(being));
	}

	update() {
		this.beings.items.forEach(being => being.update());
	}

	view(cell) {
		this.viewing = cell;

		this.graphics.x = -cell.x * this.scale + (renderer.width / 2) - (this.scale / 2);
		this.graphics.y = -cell.y * this.scale + (renderer.height / 2) - (this.scale / 2);
	}

	findByType(type) {
		return this.beings.items.filter(being => being instanceof type);
	}

	get hero() { return this.findByType(Hero)[0]; }
}