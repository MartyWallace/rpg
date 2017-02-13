import game from '../../game';
import random from '../../utils/random';

export default class Battle extends EventEmitter {
	// TODO: Remove world parameter.
	constructor(world, heroes, enemies) {
		super();

		this.heroes = heroes;
		this.enemies = enemies;
		this.creatures = heroes.concat(enemies);
		this.result = new BattleResult();

		this.marker = new PIXI.Graphics();
		this.marker.lineStyle(2, 0xFFFFFF);
		this.marker.drawRect(-3, -3, game.world.scale + 6, game.world.scale + 6);

		this.timeline = this.creatures.map(creature => {
			return { creature, count: 0 };
		});

		this.enemies.forEach(enemy => {
			enemy.on('die', () => {
				this.removeEnemy(enemy);

				if (this.enemies.length > 0) {
					game.world.view(this.getCenter(), 300);
				}
			});
		});
	}

	removeEnemy(enemy) {
		game.world.destroy(enemy);

		this.enemies.splice(this.enemies.indexOf(enemy), 1);
		this.creatures.splice(this.creatures.indexOf(enemy), 1);

		for (let i = 0; i < this.timeline.length; i++) {
			if (this.timeline[i].creature === enemy) {
				this.timeline.splice(i, 1);
			}
		}
	}

	start() {
		game.world.view(this.getCenter(), 300).then(cell => this.action());
	}

	next() {
		if (this.timeline.length > 0) {
			while (true) {
				for (let entity of this.timeline) {
					if (entity.creature.dead) {
						// Dead creatures cannot take turns.
						continue;
					}

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
		else if (this.heroes.reduce((total, hero) => total + (hero.dead ? 1 : 0), 0) >= this.heroes.length) this.defeat();
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
		this.emit('defeat', this.result);
		this.cleanup();
	}

	randomEnemy() {
		return random.fromArray(this.enemies);
	}

	randomHero() {
		return random.fromArray(this.heroes);
	}

	randomAliveHero() {
		return random.fromArray(this.heroes.filter(hero => !hero.dead));
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

		return game.world.grid.find(lowX + ((highX - lowX) / 2), lowY + ((highY - lowY) / 2));
	}
}

export class BattleResult {
	constructor() {
		this.exp = 10;
	}
}