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

	/**
	 * Sequentially work with the series of cells that this path represents, executing a callback
	 * for each cell that accepts the cell being worked with.
	 * 
	 * @param {Function} callback The callback function to call for each cell in the path. The
	 * callback accepts a Cell instance and should return an object with a "continue" property that
	 * determines whether the path should continue to be followed or whether the sequence should be
	 * terminated. The return value can also have a "data" property attached, which will be provided
	 * to the resolve function of the Promise returned by this method in the case where the path was
	 * terminated. If the end of the path is reached, null will be provided in its place.
	 * @param delay The millisecond delay between each execution of the callback.
	 * 
	 * @return {Promise}
	 */
	follow(callback, delay) {
		return new Promise((resolve, reject) => {
			let interval = setInterval(() => {
				if (this.cells.length > 0) {
					let result = callback(this.cells.shift());

					if (!('continue' in result) || !result.continue) {
						clearInterval(interval);
						resolve(('data' in result) ? result.data : null);
					}
				} else {
					clearInterval(interval);
					resolve(null);
				}
			}, delay);
		});
	}

	limit(length) {
		this.cells = this.cells.slice(0, length);

		return this;
	}

	get length() { return this.cells.length; }
}