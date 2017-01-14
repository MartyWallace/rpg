const Abilities = {
	FLOW_CREATURE_TARGETED: 'creatureTargeted',
	FLOW_CELL_TARGETED: 'cellTargeted',
	FLOW_UNTARGETED: 'untargeted',

	Types: {
		_visited: { },

		/**
		 * A conventional attack.
		 */
		attack() {
			return {
				name: 'Attack',
				flow: Abilities.FLOW_CREATURE_TARGETED,
				icon: '/textures/ability-icons/attack.png',

				behaviour(creature, battle, target) {
					return new Promise((resolve, reject) => {
						createjs.Tween.get(creature.graphics).to({ x: target.graphics.x, y: target.graphics.y }, 200).call(() => {
							let baseDamage = 1 + creature.stats.strength / 4;

							let chanceToHit = creature.stats.accuracy / target.stats.evasion;

							console.log(chanceToHit);

							if (Utils.Random.roll(chanceToHit)) {
								target.takeDamage(new Damage(Utils.Random.between(baseDamage * 0.85, baseDamage * 1.15)));
							} else {
								game.ui.battleText(target.cell, 'Miss!');
							}

							createjs.Tween.get(creature.graphics).to({ x: creature.cell.x * game.world.scale, y: creature.cell.y * game.world.scale }, 200).call(() => resolve());
						});
					});
				}
			};
		},

		/**
		 * Skip the current turn.
		 */
		skip() {
			return {
				name: 'Skip',
				flow: Abilities.FLOW_UNTARGETED,
				icon: '/textures/ability-icons/skip.png',

				behaviour(creature, battle) {
					return new Promise(resolve => resolve());
				}
			};
		},

		/**
		 * Bandage a target, recovering HP.
		 */
		bandage() {
			return {
				name: 'Bandage',
				flow: Abilities.FLOW_CREATURE_TARGETED,
				icon: '/textures/ability-icons/bandage.png',

				behaviour(creature, battle, target) {
					return new Promise((resolve, reject) => {
						createjs.Tween.get(creature.graphics).to({ x: target.graphics.x, y: target.graphics.y }, 200).call(() => {
							target.takeDamage(new Damage(Utils.Random.between(-7, -5)));
							createjs.Tween.get(creature.graphics).to({ x: creature.cell.x * game.world.scale, y: creature.cell.y * game.world.scale }, 200).call(() => resolve());
						});
					});
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