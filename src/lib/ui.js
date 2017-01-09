class UI {
	constructor() {
		this.graphics = new PIXI.Container();
		this.elements = [];
		this.heroStatuses = [];
		this.creatureStatus = null;

		game.world.on('load', () => {
			//this.showHeroStatuses(game.world.party);
		});

		game.world.on('unload', () => {
			//
		});

		game.world.on('startBattle', battle => {
			// Add battle based UI components.
			// ...
		});
	}

	update() {
		this.elements.forEach(element => element.update());
	}

	showHeroActions(hero, battle) {
		return this.simpleOptions(['Attack', 'Potion', 'Skip']);
	}

	simpleOptions(options) {
		return new Promise(resolve => {
			let menu = new PIXI.Container();

			menu.position.set(100, 100);

			options.forEach((option, index) => {
				let btn = new PIXI.Container();
				let back = Utils.Graphics.rectangle(160, 30, 0x0000CC);
				let text = new PIXI.Text(option, { fill: 0xFFFFFF, fontSize: 14 });

				btn.addChild(back);
				btn.addChild(text);

				btn.y = index * 30;

				btn.interactive = true;
				btn.buttonMode = true;

				btn.on('click', event => {
					resolve(option);
					menu.parent && menu.parent.removeChild(menu);
				});

				menu.addChild(btn);
			});

			this.graphics.addChild(menu);
		});
	}

	showHeroStatuses(party) {
		this.heroStatuses.forEach(status => {
			status.destroy();
		});

		party.heroes.forEach((hero, index) => {
			let status = new HeroStatus(hero);

			status.graphics.x = 50 + (index * 90);
			status.graphics.y = GAME_HEIGHT - 230;

			this.graphics.addChild(status.graphics);

			this.heroStatuses.push(status);
			this.elements.push(status);
		});
	}

	showDamage(creature, damage) {
		let display = new PIXI.Text(Math.abs(damage.amount), { fill: damage.amount > 0 ? 0x000000 : 0x00CC00 });
		display.position.set(creature.cell.x * game.world.scale + (game.world.scale / 2), creature.cell.y * game.world.scale + (game.world.scale / 2));

		game.world.layer('ui').addChild(display);

		setTimeout(() => display.parent.removeChild(display), 1000);
	}

	showCreatureStatus(creature) {
		this.hideCreatureStatus();

		this.creatureStatus = new CreatureStatus(creature);
		this.creatureStatus.graphics.position.set(creature.cell.x * DRAW_SCALE, (creature.cell.y + 1) * DRAW_SCALE);
		
		this.elements.push(this.creatureStatus);

		game.world.layer('ui').addChild(this.creatureStatus.graphics);
	}

	hideCreatureStatus() {
		if (this.creatureStatus) this.creatureStatus.destroy();
	}
}

class UIElement {
	constructor() {
		this.graphics = new PIXI.Container();
	}
	
	update() {
		// Update this UI element.
		// ...
	}

	destroy() {
		this.graphics.parent && this.graphics.parent.removeChild(this.graphics);
	}
}

class HeroStatus extends UIElement {
	constructor(hero) {
		super();

		this.background = Utils.Graphics.rectangle(80, 80, 0x0000CC);
		this.name = new PIXI.Text(hero.def.data.name, { fill: 0xFFFFFF, fontSize: 12 });

		this.hp = new PIXI.Text(hero.stats.health + '/' + hero.stats.maxhealth + 'HP', { fill: 0xFFFFFF, fontSize: 12 });
		this.hp.y = 30;

		this.graphics.addChild(this.background);
		this.graphics.addChild(this.name);
		this.graphics.addChild(this.hp);

		this.hero = hero;
	}

	update() {
		this.hp.text = this.hero.stats.health + '/' + this.hero.stats.maxhealth + 'HP';
	}
}

class CreatureStatus extends UIElement {
	constructor(creature) {
		super();

		this.creature = creature;

		this.background = Utils.Graphics.rectangle(160, 80, 0x333333);
		this.name = new PIXI.Text(creature.name, { fill: 0xFFFFFF, fontSize: 12 });
		this.name.y = 10;
		this.hp = new PIXI.Text(creature.stats.health + '/' + creature.stats.maxhealth + 'HP', { fill: 0xFFFFFF, fontSize: 12 });
		this.hp.y = 30;

		this.name.x = this.hp.x = 10;

		this.graphics.addChild(this.background);
		this.graphics.addChild(this.name);
		this.graphics.addChild(this.hp);

		this.bar = new Bar(140, 10, 0x252525, 0xFF0000);
		this.bar.graphics.x = 10;
		this.bar.graphics.y = 50;

		this.graphics.addChild(this.bar.graphics);
	}

	update() {
		this.hp.text = this.creature.stats.health + '/' + this.creature.stats.maxhealth + 'HP';
		this.bar.percentage = this.creature.healthPercentage;
	}
}

class Bar {
	constructor(width, height, background = 0x000000, foreground = 0xFFFFFF) {
		this.graphics = new PIXI.Container();

		this.background = Utils.Graphics.rectangle(width, height, background);
		this.foreground = Utils.Graphics.rectangle(width, height, foreground);

		this.graphics.addChild(this.background);
		this.graphics.addChild(this.foreground);

		this._percentage = 1.0;
	}

	set percentage(value) {
		this._percentage = Utils.Math.clamp(value, 0, 1);
		this.foreground.scale.x = this._percentage;
	}

	get percentage() {
		return this._percentage;
	}
}