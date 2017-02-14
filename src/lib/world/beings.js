import Stats from './systems/stats';
import game from '../game';
import animation from '../utils/animation';

export class Being extends EventEmitter {
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

	/**
	 * Calculate valid placement of this Being's graphics.
	 * 
	 * @param {Cell} cell The cell that the graphcis are moving to.
	 * 
	 * @return {Object}
	 */
	calculateGraphicsPosition(cell) {
		let result = { x: 0, y: 0 };

		if (this.graphics) {
			result.x = cell.x * game.world.scale + (game.world.scale - this.graphics.width) / 2 + this.graphics.pivot.x;
			result.y = cell.y * game.world.scale + (game.world.scale - this.graphics.height) / 2 + this.graphics.pivot.y;
		}

		return result;
	}

	setCell(cell) {
		if (this.graphics) {
			const pos = this.calculateGraphicsPosition(cell);
			this.graphics.position.set(pos.x, pos.y);
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
				animation.tween(this.graphics).to(this.calculateGraphicsPosition(cell), duration).call(() => resolve(cell));
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

export class Creature extends Being {
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

	face(cell) {
		if (this.graphics) {
			this.graphics.rotation = Math.atan2(cell.y - this.cell.y, cell.x - this.cell.x);
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

export class Enemy extends Creature {
	constructor(cell, def) {
		super(cell, def);
	}

	update() {
		this.face(game.world.party.leader.cell);
	}

	generateExpReward() {
		return 1;
	}
}

export class InteractiveBeing extends Being {
	constructor(cell, def) {
		super(cell, def);

		this.interacting = false;
	}

	approach() { }
	leave() { }
	click() { }
}