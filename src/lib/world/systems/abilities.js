import game from '../../game';
import random from '../../utils/random';
import animation from '../../utils/animation';
import battleUtils from '../../utils/battle';
import Damage from './damage';

const FLOW_CREATURE_TARGETED = 'creatureTargeted';
const FLOW_CELL_TARGETED = 'cellTargeted';
const FLOW_UNTARGETED = 'untargeted';

export default {
	FLOW_CREATURE_TARGETED,
	FLOW_CELL_TARGETED,
	FLOW_UNTARGETED,

	Types: {
		_visited: { },

		/**
		 * A conventional attack.
		 */
		attack() {
			return {
				name: 'Attack',
				flow: FLOW_CREATURE_TARGETED,
				allowDeadTargets: false,
				icon: '/textures/ability-icons/attack.png',

				getDamageRange(creature) {
					let baseDamage = 1 + creature.stats.strength / 4;
					return { min: Math.floor(baseDamage * 0.85), max: Math.ceil(baseDamage * 1.15) };
				},

				behaviour(creature, battle, target) {
					return new Promise((resolve, reject) => {
						animation.tween(creature.graphics).to(creature.calculateGraphicsPosition(target.cell), 200).call(() => {
							if (random.roll(battleUtils.getHitChance(creature, target))) {
								let range = this.getDamageRange(creature);
								target.takeDamage(new Damage(random.between(range.min, range.max)));
							} else {
								game.ui.worldText(target.cell, 'Miss!');
							}
						}).to(creature.calculateGraphicsPosition(creature.cell), 200).call(() => resolve());
					});
				},

				tip(creature) {
					let range = this.getDamageRange(creature);

					return [
						{ text: this.name, style: { fill: 0xFFFFFF, fontSize: 14 } },
						{ text: 'Strike an enemy with weapon held.', style: { fill: 0xDDDDDD, fontSize: 12 } },
						{ text: 'Damage: ' + range.min + '-' + range.max, style: { fill: 0xAAAAAA, fontSize: 12 } }
					];
				}
			};
		},

		/**
		 * Skip the current turn.
		 */
		skip() {
			return {
				name: 'Skip',
				flow: FLOW_UNTARGETED,
				icon: '/textures/ability-icons/skip.png',

				behaviour(creature, battle) {
					return new Promise(resolve => resolve());
				},

				tip(creature) {
					return [
						{ text: this.name, style: { fill: 0xFFFFFF, fontSize: 14 } },
						{ text: 'Skip this turn and perform no action.', style: { fill: 0xDDDDDD, fontSize: 12 } }
					];
				}
			};
		},

		/**
		 * Bandage a target, recovering HP.
		 */
		bandage() {
			return {
				name: 'Bandage',
				flow: FLOW_CREATURE_TARGETED,
				allowDeadTargets: false,
				icon: '/textures/ability-icons/bandage.png',

				getHealRange(creature) {
					return { min: -9, max: -13 };
				},

				behaviour(creature, battle, target) {
					return new Promise((resolve, reject) => {
						animation.tween(creature.graphics).to(creature.calculateGraphicsPosition(target.cell), 200).call(() => {
							let range = this.getHealRange(creature);
							target.takeDamage(new Damage(random.between(range.max, range.min)));
						}).to(creature.calculateGraphicsPosition(creature.cell), 200).call(() => resolve());
					});
				},

				tip(creature) {
					let range = this.getHealRange(creature);

					return [
						{ text: this.name, style: { fill: 0xFFFFFF, fontSize: 14 } },
						{ text: 'Apply bandages to a target and restore HP.', style: { fill: 0xDDDDDD, fontSize: 12 } },
						{ text: 'Heals: ' + Math.abs(range.min) + '-' + Math.abs(range.max), style: { fill: 0xAAAAAA, fontSize: 12 } }
					];
				}
			}
		}
	},

	/**
	 * Find a registered ability.
	 * 
	 * @param {String} type The ability type.
	 * 
	 * @return {Object}
	 */
	find(type) {
		if (type in this.Types) {
			if (!this.Types._visited.hasOwnProperty(type)) this.Types._visited[type] = this.Types[type]();
			return this.Types._visited[type];
		} else {
			throw new Error('Ability "' + type + '" does not exist.');
		}
	}
};