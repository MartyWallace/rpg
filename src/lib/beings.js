/**
 * Creature stats e.g. health, strength.
 */
class Stats {
	constructor(creature, base) {
		this.level = 1;
		this.health = 1;
		this.maxHealth = 1;
		this.energy = 1;
		this.maxEnergy = 1;
		this.strength = 1;
		this.evasion = 1;
		this.accuracy = 1; // TODO: Probably rename this later.

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
			energy: this.energy,
			maxEnergy: this.maxEnergy,
			strength: this.strength,
			evasion: this.evasion,
			accuracy: this.accuracy
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
				Utils.Animation.tween(this.graphics).to({
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
		if (!this.dead) {
			game.ui.showDamage(this, damage);

			this.stats.health -= damage.amount;

			this.stats.health = Math.max(0, this.stats.health);
			this.stats.health = Math.min(this.stats.health, this.stats.maxHealth);

			if (this.stats.health <= 0) {
				// This creature is dead.
				this.die();
			}
		} else {
			console.warn('Dead creatures cannot take damage.');
		}
	}

	action(battle) {
		return new Promise(resolve => resolve());
	}

	die() {
		this.emit('die');
	}

	revive() {
		this.stats.health = 1;
		this.emit('revive');
	}

	get healthPercentage() {
		return this.stats.health / this.stats.maxHealth;
	}

	get energyPercentage() {
		return this.stats.energy / this.stats.maxEnergy;
	}

	get dead() {
		return this.stats.health <= 0;
	}
}

class Hero extends Creature {
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

		this.graphics = new PIXI.Sprite(game.textures.hero1);
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
				if (ability.flow === Abilities.FLOW_CREATURE_TARGETED || ability.flow === Abilities.FLOW_CELL_TARGETED) {
					let interaction = cell => {
						if (ability.flow === Abilities.FLOW_CREATURE_TARGETED) {
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
						} else if (ability.flow === Abilities.FLOW_CELL_TARGETED) {
							ability.behaviour(this, battle, cell).then(() => resolve());

							game.world.off('interact', interaction);
						}
					};

					game.world.on('interact', interaction);
				} else if (ability.flow === Abilities.FLOW_UNTARGETED) {
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
			strength: Utils.Random.between(15, 20),
			evasion: 10,
			accuracy: 16,
			level: 1
		});

		this.graphics = new PIXI.Sprite(game.textures.skeleton);

		this.setCell(cell);
	}

	action(battle) {
		return new Promise(resolve => {
			let target = battle.randomAliveHero();

			if (target) {
				setTimeout(() => {
					Abilities.find('attack').behaviour(this, battle, target).then(() => resolve());
				}, 200);
			} else {
				// Couldn't find a target, all heroes likely dead.
				// ...
			}
		});
	}
}

const beings = {
	Wall, Door, Hero, Skeleton
};