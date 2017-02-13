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
				animation.tween(this.graphics).to({
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