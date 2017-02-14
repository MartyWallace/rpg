import game from '../../game';
import { Enemy } from '../beings';
import random from '../../utils/random';
import abilities from '../systems/abilities';

export default class Skeleton extends Enemy {
	constructor(cell, def) {
		super(cell, def);

		this.wait = 6;
		this.name = 'Skeleton';
		
		this.stats.merge({
			vitality: 3,
			strength: random.between(9, 12),
			evasion: 10,
			accuracy: 14,
			level: 1
		});

		this.stats.refill();

		this.graphics = new PIXI.Sprite.fromImage('/textures/skeleton.png');
		this.graphics.pivot.set(this.graphics.width / 2, this.graphics.height / 2);

		this.setCell(cell);
	}

	action(battle) {
		return new Promise(resolve => {
			let target = battle.randomAliveHero();

			if (target) {
				setTimeout(() => {
					abilities.find('attack').behaviour(this, battle, target).then(() => resolve());
				}, 200);
			} else {
				// Couldn't find a target, all heroes likely dead.
				// ...
			}
		});
	}

	generateExpReward() {
		return 1 + Math.round(random.between(3, 5));
	}
}