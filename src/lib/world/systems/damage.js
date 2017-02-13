export default class Damage {
	constructor(amount = 0) {
		this.amount = Math.round(amount);
	}

	isHealing() {
		return this.amount < 0;
	}

	get absolute() { return Math.abs(this.amount); }
}