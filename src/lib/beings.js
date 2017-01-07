class Being extends EventEmitter {
	constructor(world, cell, def) {
		super();

		this.world = world;
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
			this.graphics.x = cell.x * this.world.scale;
			this.graphics.y = cell.y * this.world.scale;
		}

		this.prevCell = this.cell;
		this.cell = cell;
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
	constructor(world, cell, def) {
		super(world, cell, def);

		this.interacting = false;
	}

	approach() { }
	leave() { }
	click() { }
}

class Wall extends Being {
	constructor(world, cell, def) {
		super(world, cell, def);

		this.walkable = false;
		this.layer = 'structures';

		this.graphics = Utils.Graphics.rectangle(world.scale, world.scale, 0x000000);
		
		this.setCell(cell);
	}
}

class Door extends InteractiveBeing {
	constructor(world, cell, def) {
		super(world, cell, def);

		this.walkable = false;
		this.layer = 'structures';

		this.graphics = Utils.Graphics.rectangle(world.scale, world.scale, 0xFF0000);
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
	constructor(world, cell, def) {
		super(world, cell, def);

		let hp = Math.round(Utils.Random.between(4, 6));

		this.stats = {
			health: hp,
			maxhealth: hp,
			wait: 1
		};

		this.walkable = false;
		this.layer = 'creatures';
	}

	takeDamage(amount) {
		amount = Math.round(amount);

		game.ui.showDamage(this, amount);

		this.stats.health -= amount;

		this.stats.health = Math.max(0, this.stats.health);
		this.stats.health = Math.min(this.stats.health, this.stats.maxhealth);

		if (this.stats.health <= 0) {
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
	constructor(world, cell, def) {
		super(world, cell, def);

		this.wait = 5;
		this.stats.health = this.stats.maxhealth = 12;
		this.graphics = Utils.Graphics.circle(world.scale / 2, def.data.attrs.color);

		this.name = def.data.name;

		this.setCell(cell);
	}

	action(battle) {
		return new Promise(resolve => {
			game.ui.showHeroActions(this, battle).then(selection => {
				if (selection === 'Attack') {
					let interaction = cell => {
						if (cell.content instanceof Creature) {
							cell.content.takeDamage(Utils.Random.between(1, 3));

							game.world.off('interact', interaction);
							resolve();
						} else {
							// Must select a creature.
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
	constructor(world, cell, def) {
		super(world, cell, def);
	}
}

class Skeleton extends Enemy {
	constructor(world, cell, def) {
		super(world, cell, def);

		this.wait = 6;
		this.name = 'Skeleton';

		this.graphics = Utils.Graphics.circle(world.scale / 2, 0x00CC22);

		this.setCell(cell);
	}

	action(battle) {
		return new Promise(resolve => {
			setTimeout(() => {
				let hero = battle.randomHero();
				hero.takeDamage(Utils.Random.between(1, 3));

				resolve();
			}, 1000);
		});
	}
}

const beings = {
	Wall, Door, Hero, Skeleton
};