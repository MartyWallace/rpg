class Damage {
	constructor(amount = 0) {
		this.amount = Math.round(amount);
	}
}

/**
 * Creature stats e.g. health, strength.
 */
class Stats {
	constructor(creature, base) {
		this.level = 1;
		this.health = 1;
		this.maxHealth = 1;
		this.strength = 1;

		if (base) {
			this.merge(base);
		}
	}

	merge(stats) {
		for (let stat in stats) {
			if (this.hasOwnProperty(stat)) {
				this[stat] = Math.round(stats[stat]);
			}
		}
	}

	save() {
		return {
			level: this.level,
			health: this.health,
			maxHealth: this.maxHealth,
			strength: this.strength
		};
	}

	get healthPercentage() {
		return this.health / this.maxHealth;
	}
}

class Being extends EventEmitter {
	constructor(cell, def) {
		super();

		this.cell = cell;
		this.def = def;
		this.prevCell = null;
		this.graphics = null;
		this.walkable = true;

		this.name = '';
		this.layer = 'terrain';
	}

	setCell(cell) {
		if (this.graphics) {
			this.graphics.x = cell.x * game.world.scale;
			this.graphics.y = cell.y * game.world.scale;
		}

		this.prevCell = this.cell;
		this.cell = cell;
	}

	/**
	 * Move this Being to another cell, optionally animating its graphics with TweenJS.
	 * 
	 * @param {Cell} cell The target Cell.
	 * @param {Number} duration The amount of time the animation should take.
	 * 
	 * @return {Promise}
	 */
	moveToCell(cell, duration = 0) {
		return new Promise((resolve, reject) => {
			if (this.graphics) {
				createjs.Tween.get(this.graphics).to({
					x: cell.x * game.world.scale,
					y: cell.y * game.world.scale
				}, duration).call(() => resolve(cell));
			}

			this.prevCell = this.cell;
			this.cell = cell;
		});
	}

	update() {
		//
	}

	save() {
		return {
			type: this.def.type,
			x: this.cell.x,
			y: this.cell.y
		};
	}
}

class InteractiveBeing extends Being {
	constructor(cell, def) {
		super(cell, def);

		this.interacting = false;
	}

	approach() { }
	leave() { }
	click() { }
}

class Wall extends Being {
	constructor(cell, def) {
		super(cell, def);

		this.walkable = false;
		this.layer = 'structures';

		this.graphics = Utils.Graphics.rectangle(game.world.scale, game.world.scale, 0x000000);
		
		this.setCell(cell);
	}
}

class Door extends InteractiveBeing {
	constructor(cell, def) {
		super(cell, def);

		this.walkable = false;
		this.layer = 'structures';

		this.graphics = Utils.Graphics.rectangle(game.world.scale, game.world.scale, 0xFF0000);
		this.graphics.interactive = true;
		this.graphics.buttonMode = true;

		this.setCell(cell);
	}

	click() {
		let target = this.def.destination.level;

		if (target >= 0 && target < LEVELS.length) {
			game.world.unload();
			game.world.load(LEVELS[this.def.destination.level], {
				x: this.def.destination.x, y: this.def.destination.y, heroes: game.world.party.save()
			});
		} else {
			throw new Error(`Level ${target} does not exist.`);
		}
	}
}

class Creature extends Being {
	constructor(cell, def) {
		super(cell, def);

		this.stats = new Stats(this);
		this.walkable = false;
		this.layer = 'creatures';
	}

	takeDamage(damage) {
		game.ui.showDamage(this, damage);

		this.stats.health -= damage.amount;

		this.stats.health = Math.max(0, this.stats.health);
		this.stats.health = Math.min(this.stats.health, this.stats.maxHealth);

		if (this.stats.health <= 0) {
			// This creature is dead.
			this.die();
		}
	}

	action(battle) {
		return new Promise(resolve => resolve());
	}

	die() {
		this.emit('die');
	}

	get healthPercentage() {
		return this.stats.health / this.stats.maxHealth;
	}
}

class Hero extends Creature {
	constructor(cell, def) {
		super(cell, def);

		this.wait = 5;
		this.stats.merge(def.data.stats);

		this.graphics = new PIXI.Sprite(game.textures.hero1);
		this.name = def.data.name;

		this.setCell(cell);
	}

	action(battle) {
		return new Promise(resolve => {
			game.ui.showHeroActions(this, battle).then(ability => {
				if (ability.flow === Abilities.FLOW_CREATURE_TARGETED || ability.flow === Abilities.FLOW_CELL_TARGETED) {
					let interaction = cell => {
						if (ability.flow === Abilities.FLOW_CREATURE_TARGETED) {
							if (cell.content instanceof Creature) {
								ability.behaviour(this, battle, cell.content).then(() => resolve());

								game.world.off('interact', interaction);
							} else {
								// Need to target a creature.
								// ...
							}
						} else if (ability.flow === Abilities.FLOW_CELL_TARGETED) {
							ability.behaviour(this, battle, cell).then(() => resolve());

							game.world.off('interact', interaction);
						}
					};

					game.world.on('interact', interaction);
				} else if (ability.flow === Abilities.FLOW_UNTARGETED) {
					// Instant ability.
					console.log(ability);
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
			attrs: this.def.data.attrs,
			abilities: this.def.data.abilities
		};
	}

	get abilities() {
		return this.def.data.abilities;
	}
}

class Enemy extends Creature {
	constructor(cell, def) {
		super(cell, def);
	}
}

class Skeleton extends Enemy {
	constructor(cell, def) {
		super(cell, def);

		this.wait = 6;
		this.name = 'Skeleton';

		let health = Utils.Random.between(8, 12);
		
		this.stats.merge({
			health,
			maxHealth: health,
			strength: Utils.Random.between(8, 10)
		});

		this.graphics = new PIXI.Sprite(game.textures.skeleton);

		this.setCell(cell);
	}

	action(battle) {
		return new Promise(resolve => {
			let target = battle.randomHero();

			setTimeout(() => {
				Abilities.find('attack').behaviour(this, battle, target).then(() => resolve());
			}, 200);
		});
	}
}

const beings = {
	Wall, Door, Hero, Skeleton
};