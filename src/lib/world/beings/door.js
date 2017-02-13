import game from '../../game';
import { InteractiveBeing } from '../beings';
import graphics from '../../utils/graphics';
import config from '../../../config';

export default class Door extends InteractiveBeing {
	constructor(cell, def) {
		super(cell, def);

		this.walkable = false;
		this.layer = 'structures';

		this.graphics = graphics.rectangle(game.world.scale, game.world.scale, 0xFF0000);
		this.graphics.interactive = true;
		this.graphics.buttonMode = true;

		this.setCell(cell);
	}

	click() {
		let target = this.def.destination.level;

		if (target >= 0 && target < config.LEVELS.length) {
			game.world.unload();
			game.world.load(config.LEVELS[this.def.destination.level], {
				x: this.def.destination.x, y: this.def.destination.y, heroes: game.world.party.save()
			});
		} else {
			throw new Error(`Level ${target} does not exist.`);
		}
	}
}