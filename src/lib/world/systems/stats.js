export default class Stats {
	constructor(creature, base) {
		this.level = 1;
		this.health = 1;
		this.maxHealth = 1;
		this.energy = 1;
		this.maxEnergy = 1;
		this.strength = 1;
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

	save() {
		return {
			level: this.level,
			health: this.health,
			maxHealth: this.maxHealth,
			energy: this.energy,
			maxEnergy: this.maxEnergy,
			strength: this.strength,
			evasion: this.evasion,
			accuracy: this.accuracy
		};
	}

	get healthPercentage() {
		return this.health / this.maxHealth;
	}
}