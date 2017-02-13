import game from '../../game';
import { Creature } from '../beings';
import abilities from '../systems/abilities';

export default class Hero extends Creature {
	constructor(cell, def) {
		super(cell, def);

		this.wait = 5;
		this.stats.merge(def.data.stats);

		if (def.data.levelling) {
			this.levelling = def.data.levelling;
		} else {
			this.levelling = {
				exp: 0,
				nextLevel: 10,
				abilityPoints: 0,
				statPoints: 0
			};
		}

		this.graphics = PIXI.Sprite.fromImage(def.data.attrs.texture);

		this.name = def.data.name;

		this.setCell(cell);

		this.on('die', () => this.graphics.alpha = 0.4);
		this.on('revive', () => this.graphics.alpha = 1);

		if (this.stats.health <= 0) this.die();
	}

	/**
	 * Add EXP to this hero. Returns the amount of levels advanced.
	 * 
	 * @returns {Number}
	 */
	addExp(amount) {
		let levels = 0;

		while (amount > 0) {
			this.levelling.exp += 1;

			if (this.levelling.exp >= this.levelling.nextLevel) {
				this.levelUp();

				this.levelling.exp = 0;
				this.levelling.nextLevel = Math.round(this.levelling.nextLevel * 1.25);

				levels += 1;
			}

			amount -= 1;
		}

		return levels;
	}

	levelUp() {
		this.stats.level += 1;
		this.levelling.abilityPoints += 1;
		this.levelling.statPoints += 2;
	}

	action(battle) {
		return new Promise(resolve => {
			game.ui.showHeroActions(this, battle).then(ability => {
				if (ability.flow === abilities.FLOW_CREATURE_TARGETED || ability.flow === abilities.FLOW_CELL_TARGETED) {
					let interaction = cell => {
						if (ability.flow === abilities.FLOW_CREATURE_TARGETED) {
							if (cell.content instanceof Creature) {
								if (!cell.content.dead || ability.allowDeadTargets) {
									ability.behaviour(this, battle, cell.content).then(() => resolve());

									game.world.off('interact', interaction);
								} else {
									console.warn('This ability cannot target dead creatures.');
								}
							} else {
								console.warn('This ability must target a creature.');
							}
						} else if (ability.flow === abilities.FLOW_CELL_TARGETED) {
							ability.behaviour(this, battle, cell).then(() => resolve());

							game.world.off('interact', interaction);
						}
					};

					game.world.on('interact', interaction);
				} else if (ability.flow === abilities.FLOW_UNTARGETED) {
					// Instant ability.
					ability.behaviour(this, battle).then(() => resolve());
				} else {
					console.warn('Unknown ability flow type: "' + ability.flow + '".');
				}
			});
		});
	}

	save() {
		return {
			name: this.def.data.name,
			stats: this.stats.save(),
			levelling: this.levelling,
			attrs: this.def.data.attrs,
			abilities: this.def.data.abilities
		};
	}

	get abilities() {
		return this.def.data.abilities;
	}
}