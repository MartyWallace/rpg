class Being {
	constructor(world, cell, def) {
		this.world = world;
		this.cell = cell;
		this.def = def;
		this.prevCell = null;
		this.graphics = null;
		this.walkable = true;
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

		this.graphics = new PIXI.Graphics();
		this.graphics.beginFill(0x111111);
		this.graphics.drawRect(0, 0, world.scale, world.scale);
		
		this.setCell(cell);
	}
}

class Creature extends Being {
	constructor(world, cell, def) {
		super(world, cell, def);

		this.stats = {
			health: 8,
			maxhealth: 8,
			energy: 3,
			maxenergy: 3
		};
	}

	takeDamage(amount) {
		this.stats.health -= amount;

		this.stats.health = Math.max(0, this.stats.health);
		this.stats.health = Math.min(this.stats.health, this.stats.maxhealth);

		if (this.stats.health <= 0) {
			this.die();
		}
	}

	die() {
		console.log('dead');
	}

	get healthPercentage() {
		return this.stats.health / this.stats.maxhealth;
	}

	get energyPercentage() {
		return this.stats.energy / this.stats.maxenergy;
	}
}

class Hero extends Creature {
	constructor(world, cell, def) {
		super(world, cell, def);

		this.graphics = new PIXI.Graphics();
		this.graphics.beginFill(def.data.attrs.color);
		this.graphics.drawRect(0, 0, world.scale, world.scale);
		this.graphics.endFill();

		this.setCell(cell);
	}

	save() {
		return null;
	}
}

class Enemy extends Creature {
	constructor(world, cell, def) {
		super(world, cell, def);

		this.walkable = false;
		this.movement = 2;
	}

	action() {
		return new Promise((resolve, reject) => {
			let path = this.world.grid.path(this.cell, this.world.party.leader.cell, true);

			if (path.length > 3) {
				// Move.
				path.limit(this.movement).follow(cell => {
					this.setCell(cell);
				}, 80).then(() => resolve());
			} else {
				// Attack.
				this.attack().then(() => resolve());
			}
		});
	}

	attack() {
		return new Promise((resolve, reject) => resolve());
	}
}

class Skeleton extends Enemy {
	constructor(world, cell, def) {
		super(world, cell, def);

		this.graphics = new PIXI.Graphics();
		this.graphics.beginFill(0x00CC22);
		this.graphics.drawRect(0, 0, world.scale, world.scale);
		this.graphics.endFill();

		this.setCell(cell);
	}

	attack() {
		return new Promise((resolve, reject) => {
			this.world.party.randomHero().takeDamage(1);
			resolve();
		});
	}
}

const beings = {
	Wall, Hero, Skeleton
};