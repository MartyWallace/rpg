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

	get empty() {
		return this.content === null;
	}
}

class CellGroup {
	constructor(cells) {
		this.cells = cells;
	}
}

class Path extends CellGroup {
	constructor(cells) {
		super(cells);
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

	limit(length) {
		this.cells = this.cells.slice(0, length);

		return this;
	}
}