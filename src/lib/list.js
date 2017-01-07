class List {
	constructor() {
		this.items = [];
	}

	add(item) {
		this.items.push(item);
	}

	remove(item) {
		let index = this.items.indexOf(item);
		if (index >= 0) this.items.splice(index, 1)
	}

	empty(callback) {
		while (this.items.length > 0) {
			let removed = this.items.pop();
			callback && callback(removed);
		}
	}
}