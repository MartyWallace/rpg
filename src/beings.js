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
			health: 1,
			maxhealth: 1
		};
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
}

class Enemy extends Creature {
	constructor(world, cell, def) {
		super(world, cell, def);

		this.cooldown = 4;
		this.maxCooldown = 4;

		this.movement = 2;

		world.on('playerMoved', () => {
			this.cooldown -= 1;

			if (this.cooldown <= 0) {
				this.action();
				this.cooldown = this.maxCooldown;
				this.world.emit('startActing', this);
			}
		});
	}

	action() {
		this.world.emit('endActing', this);
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

	action() {
		let path = this.world.grid.path(this.cell, this.world.party.leader.cell, true);
		path.cells = path.cells.slice(0, this.movement);

		path.follow(cell => {
			this.setCell(cell);
		}, 80).then(() => this.world.emit('endActing', this));
	}
}

const beings = {
	Wall, Hero, Skeleton
};