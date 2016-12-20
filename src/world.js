class Being {
	constructor(world, cell) {
		this.world = world;
		this.cell = cell;
		this.graphics = null;
	}

	setCell(cell) {
		if (this.graphics) {
			this.graphics.x = cell.x * this.world.scale;
			this.graphics.y = cell.y * this.world.scale;
		}

		this.cell = cell;
	}

	update() {
		//
	}
}

class Wall extends Being {
	constructor(world, cell) {
		super(world, cell);

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
		this.graphics.beginFill(0xFF0000);
		this.graphics.drawRect(0, 0, world.scale, world.scale);
		this.graphics.endFill();

		this.setCell(cell);
	}
}

const beings = {
	Wall, Hero
};

class Grid {
	constructor(width, height) {
		this.width = width;
		this.height = height;
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
			throw new Error('Trying to get an out of bounds cell.');
		}

		return this.cells[y][x];
	}
}

class Cell {
	constructor(grid, x, y) {
		this.grid = grid;
		this.x = x;
		this.y = y;
	}
}

class World extends EventEmitter {
	constructor(width, height, scale = 40) {
		super();

		this.scale = scale;
		this.beings = new List();
		this.graphics = new PIXI.Container();
		this.viewing = null;

		this.setupGrid(width, height, scale);
	}

	setupGrid(width, height, scale) {
		this.grid = new Grid(width, height);

		for (let x = 0; x <= width; x++) {
			let graphics = new PIXI.Graphics();
			graphics.lineStyle(3, 0xCCCCCC);
			graphics.moveTo(0, 0);
			graphics.lineTo(0, height * scale);
			graphics.x = x * scale;

			this.graphics.addChild(graphics);
		}

		for (let y = 0; y <= height; y++) {
			let graphics = new PIXI.Graphics();
			graphics.lineStyle(3, 0xCCCCCC);
			graphics.moveTo(0, 0);
			graphics.lineTo(width * scale, 0);
			graphics.y = y * scale;

			this.graphics.addChild(graphics);
		}
	}

	handleClick(x, y) {
		let cell = this.grid.find(x - this.graphics.x, y - this.graphics.y, this.scale);

		this.view(cell);
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

	load(level) {
		if (typeof level === 'string') {
			level = JSON.parse(level);
		}

		level.beings.forEach(def => {
			this.create(beings[def.type], this.grid.find(def.x, def.y));
		});
	}

	unload() {
		this.beings.forEach(being => this.destroy(being));
		this.beings = [];
	}

	update() {
		this.beings.items.forEach(being => being.update());
	}

	view(cell) {
		this.viewing = cell;

		this.graphics.x = -cell.x * this.scale + (renderer.width / 2) - (this.scale / 2);
		this.graphics.y = -cell.y * this.scale + (renderer.height / 2) - (this.scale / 2);
	}
}