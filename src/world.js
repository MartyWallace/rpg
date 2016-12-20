class Grid {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.cells = [];

		for (let x = 0; x < width; x++) {
			this.cells[x] = [];

			for (let y = 0; y < height; y++) {
				this.cells[x][y] = new Cell(this, x, y);
			}
		}
	}

	find(x, y) {
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

class World {
	constructor() {
		this.beings = new List();
		this.grid = new Grid(100, 100);
		this.graphics = new PIXI.Container();
	}

	drawGrid(scale) {
		//
	}

	update() {
		this.beings.items.forEach(being => being.update());
	}
}

class Being {
	update() {
		//
	}
}

class Mobile extends Being {
	//
}