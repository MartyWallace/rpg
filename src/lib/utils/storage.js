export default {
	save(name, data) {
		localStorage.setItem(name, JSON.stringify(data));
	},

	load(name, fallback = null) {
		let value = localStorage.getItem(name);
		return value === null ? fallback : JSON.parse(value);
	},

	clear() {
		localStorage.clear();
	}
};