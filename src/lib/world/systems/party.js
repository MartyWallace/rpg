import game from '../../game';
import random from '../../utils/random';

export default class Party extends EventEmitter {
	constructor(heroes) {
		super();

		this.heroes = heroes;
	}

	moveToCell(cell, duration = 0) {
		return new Promise((resolve, reject) => {
			let last = cell;
			let moves = [];

			this.heroes.forEach(hero => {
				moves.push(hero.moveToCell(last, duration, 'linear'));
				last = hero.prevCell;
			});
			
			Promise.all(moves).then(cells => {
				game.world.alertInteractiveBeings(cell);
				resolve(cell);
			});
		});
	}

	save() {
		return this.heroes.map(hero => hero.save());
	}

	randomHero() {
		return random.fromArray(this.heroes);
	}

	get leader() {
		return this.heroes.length > 0 ? this.heroes[0] : null;
	}
}