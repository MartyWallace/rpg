export default class Map {
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