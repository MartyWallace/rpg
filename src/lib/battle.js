class Battle extends EventEmitter {
	constructor(world, heroes, enemies) {
		super();

		this.world = world;
		this.heroes = heroes;
		this.enemies = enemies;
		this.creatures = heroes.concat(enemies);
		this.result = new BattleResult();

		this.timeline = this.creatures.map(creature => {
			return { creature, count: 0 };
		});

		this.enemies.forEach(enemy => {
			enemy.on('die', () => this.removeEnemy(enemy));
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
		this.action();
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
		if (this.enemies.length === 0) this.victory();
		else if (this.heroes.length === 0) this.defeat();
		else {
			let next = this.next();

			if (next) {
				this.world.view(next.cell, 300).then(cell => {
					next.action(this).then(r => this.action())
				});
			} else {
				// This should never happen.
				console.warn('Somehow ended up in a stuck battle.');
			}
		}
	}

	victory() {
		this.emit('victory', this.result);
	}

	defeat() {
		this.emit('defeat');
	}

	randomEnemy() {
		return Utils.Random.fromArray(this.enemies);
	}

	randomHero() {
		return Utils.Random.fromArray(this.heroes);
	}
}

class BattleResult {
	constructor() {
		this.exp = 10;
	}
}