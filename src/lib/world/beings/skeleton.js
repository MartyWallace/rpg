import game from '../../game';
import { Enemy } from '../beings';
import random from '../../utils/random';
import abilities from '../systems/abilities';

export default class Skeleton extends Enemy {
	constructor(cell, def) {
		super(cell, def);

		this.wait = 6;
		this.name = 'Skeleton';

		let health = random.between(8, 12);
		
		this.stats.merge({
			health,
			maxHealth: health,
			strength: random.between(15, 20),
			evasion: 10,
			accuracy: 16,
			level: 1
		});

		this.graphics = new PIXI.Sprite(game.textures.skeleton);
		this.graphics.width = game.world.scale;
		this.graphics.height = game.world.scale;

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
}