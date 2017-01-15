const BattleUtils = {
	/**
	 * Calculate hit chance between 0.1 and 1.0.
	 * 
	 * @param {Creature} sender The creature attempting to hit something.
	 * @param {Creature} receiver The creature being hit.
	 * 
	 * @return {Number}
	 */
	getHitChance(sender, receiver) {
		// The percentage difference between half the sender's accuracy and the receiver's total
		// evason. This gives a 50% chance for matching accuracy and evasion and a 100% chance for
		// anything equal to or over double accuracy.
		return Utils.Math.clamp((sender.stats.accuracy / 2) / receiver.stats.evasion, 0.1, 1.0);
	}
};

class Battle extends EventEmitter {
	constructor(world, heroes, enemies) {
		super();

		this.world = world;
		this.heroes = heroes;
		this.enemies = enemies;
		this.creatures = heroes.concat(enemies);
		this.result = new BattleResult();

		this.marker = new Utils.Graphics.rectangle(10, 10, 0xFF0000);

		this.timeline = this.creatures.map(creature => {
			return { creature, count: 0 };
		});

		this.enemies.forEach(enemy => {
			enemy.on('die', () => {
				this.removeEnemy(enemy);

				if (this.enemies.length > 0) {
					this.world.view(this.getCenter(), 300);
				}
			});
		});
	}

	removeEnemy(enemy) {
		this.world.destroy(enemy);

		this.enemies.splice(this.enemies.indexOf(enemy), 1);
		this.creatures.splice(this.creatures.indexOf(enemy), 1);

		for (let i = 0; i < this.timeline.length; i++) {
			if (this.timeline[i].creature === enemy) {
				this.timeline.splice(i, 1);
			}
		}
	}

	start() {
		this.world.view(this.getCenter(), 300).then(cell => this.action());
	}

	next() {
		if (this.timeline.length > 0) {
			while (true) {
				for (let entity of this.timeline) {
					entity.count += entity.creature.wait;

					if (entity.count >= 100) {
						entity.count = 0;

						return entity.creature;
					}
				}
			}
		}

		return null;
	}

	action() {
		this.marker.parent && game.world.layer('ui').removeChild(this.marker);

		if (this.enemies.length === 0) this.victory();
		else if (this.heroes.length === 0) this.defeat();
		else {
			let next = this.next();
			
			this.marker.position.set(next.cell.x * game.world.scale, next.cell.y * game.world.scale);
			game.world.layer('ui').addChild(this.marker);

			if (next) {
				next.action(this).then(r => this.action())
			} else {
				// This should never happen.
				console.warn('Somehow ended up in a stuck battle.');
			}
		}
	}

	victory() {
		this.emit('victory', this.result);
		this.cleanup();
	}

	defeat() {
		this.emit('defeat');
		this.cleanup();
	}

	randomEnemy() {
		return Utils.Random.fromArray(this.enemies);
	}

	randomHero() {
		return Utils.Random.fromArray(this.heroes);
	}

	cleanup() {
		this.marker.parent && game.world.layer('ui').removeChild(this.marker);
	}

	getCenter() {
		let lowX = null;
		let lowY = null;
		let highX = null;
		let highY = null;

		this.creatures.forEach(creature => {
			if (lowX === null || creature.cell.x < lowX) lowX = creature.cell.x;
			if (lowY === null || creature.cell.y < lowY) lowY = creature.cell.y;
			if (highX === null || creature.cell.x > highX) highX = creature.cell.x;
			if (highY === null || creature.cell.y > highY) highY = creature.cell.y;
		});

		return this.world.grid.find(lowX + ((highX - lowX) / 2), lowY + ((highY - lowY) / 2));
	}
}

class BattleResult {
	constructor() {
		this.exp = 10;
	}
}