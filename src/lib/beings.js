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

class Wall extends Being {
	constructor(world, cell, def) {
		super(world, cell, def);

		this.walkable = false;

		this.graphics = Utils.Graphics.rectangle(world.scale, world.scale, 0x000000);
		
		this.setCell(cell);
	}
}

class Creature extends Being {
	constructor(world, cell, def) {
		super(world, cell, def);

		this.stats = {
			health: 1,
			maxhealth: 1,
			wait: 1
		};

		this.walkable = false;
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

		this.setCell(cell);
	}

	action(battle) {
		return new Promise(resolve => {
			game.ui.showHeroActions(this, battle).then(selection => {
				if (selection === 'Attack') battle.randomEnemy().takeDamage(1);
				resolve();
			});
		});
	}

	save() {
		return null;
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
	Wall, Hero, Skeleton
};