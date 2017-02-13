export default class Stats {
	constructor(creature, base) {
		this.level = 1;
		this.health = 1;
		this.energy = 1;
		this.maxEnergy = 1;
		this.strength = 1;
		this.vitality = 1;
		this.evasion = 1;
		this.accuracy = 1;

		if (base) {
			this.merge(base);
		}
	}

	merge(stats) {
		for (let stat in stats) {
			if (this.hasOwnProperty(stat)) {
				this[stat] = Math.round(stats[stat]);
			}
		}
	}

	refill() {
		this.health = this.maxHealth;
		this.energy = this.maxEnergy;
	}

	save() {
		return {
			level: this.level,
			health: this.health,
			energy: this.energy,
			maxEnergy: this.maxEnergy,
			strength: this.strength,
			vitality: this.vitality,
			evasion: this.evasion,
			accuracy: this.accuracy
		};
	}

	/** @type {number} */
	get maxHealth() {
		return Math.round((this.vitality * 2) + (this.level * this.vitality * 0.25));
	}

	get healthPercentage() {
		return this.health / this.maxHealth;
	}
}