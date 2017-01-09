class Damage {
	constructor(amount = 0) {
		this.amount = Math.round(amount);
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

		let hp = Math.round(Utils.Random.between(4, 6));

		this.stats = {
			health: hp,
			maxhealth: hp
		};

		this.walkable = false;
		this.layer = 'creatures';
	}

	takeDamage(damage) {
		game.ui.showDamage(this, damage);

		this.stats.health -= damage.amount;

		this.stats.health = Math.max(0, this.stats.health);
		this.stats.health = Math.min(this.stats.health, this.stats.maxhealth);

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
		return this.stats.health / this.stats.maxhealth;
	}
}

class Hero extends Creature {
	constructor(cell, def) {
		super(cell, def);

		this.wait = 5;
		this.stats = def.data.stats;

		this.graphics = new PIXI.Sprite(game.textures.hero1);
		this.name = def.data.name;

		this.setCell(cell);
	}

	action(battle) {
		return new Promise(resolve => {
			game.ui.showHeroActions(this, battle).then(selection => {
				if (selection === 'Attack' || selection === 'Potion') {
					let interaction = cell => {
						if (cell.content instanceof Creature) {
							let target = cell.content;

							createjs.Tween.get(this.graphics).to({ x: target.graphics.x, y: target.graphics.y }, 200).call(() => {
								let damage = new Damage(selection === 'Attack' ? Utils.Random.between(1, 3) : Utils.Random.between(-15, -12));

								target.takeDamage(damage);
								createjs.Tween.get(this.graphics).to({ x: this.cell.x * game.world.scale, y: this.cell.y * game.world.scale }, 200).call(() => resolve());
							});

							game.world.off('interact', interaction);
						} else {
							// Must select a creature, do nothing for now. Will have skills where you
							// can select a cell for splash damage later.
							// ...
						}
					};

					game.world.on('interact', interaction);
				} else {
					resolve();
				}
			});
		});
	}

	save() {
		return this.def.data;
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

		this.graphics = new PIXI.Sprite(game.textures.skeleton);

		this.setCell(cell);
	}

	action(battle) {
		return new Promise(resolve => {
			let target = battle.randomHero();

			setTimeout(() => {
				createjs.Tween.get(this.graphics).to({ x: target.graphics.x, y: target.graphics.y }, 200).call(() => {
					target.takeDamage(new Damage(Utils.Random.between(1, 2)));
					createjs.Tween.get(this.graphics).to({ x: this.cell.x * game.world.scale, y: this.cell.y * game.world.scale }, 200).call(() => resolve());
				});
			}, 500);
		});
	}
}

const beings = {
	Wall, Door, Hero, Skeleton
};