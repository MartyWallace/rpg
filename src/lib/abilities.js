const Abilities = {
	Types: {
		attack: {
			behaviour(creature, battle, target) {
				return new Promise((resolve, reject) => {
					createjs.Tween.get(creature.graphics).to({ x: target.graphics.x, y: target.graphics.y }, 200).call(() => {
						target.takeDamage(new Damage(Utils.Random.between(4, 6)));
						createjs.Tween.get(creature.graphics).to({ x: creature.cell.x * game.world.scale, y: creature.cell.y * game.world.scale }, 200).call(() => resolve());
					});
				});
			}
		},

		skip: {
			behaviour(creature, battle) {
				return new Promise(resolve => resolve());
			}
		}
	},

	find(type) {
		if (type in this.Types) {
			return this.Types[type];
		} else {
			throw new Error('Ability "' + type + '" does not exist.');
		}
	}
};