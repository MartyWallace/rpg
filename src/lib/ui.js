class UI {
	constructor() {
		this.graphics = new PIXI.Container();
		this.elements = [];
		this.heroStatuses = [];

		game.world.on('load', () => {
			this.showHeroStatuses(game.world.party);
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
		return this.simpleOptions(['Attack', 'Skip']);
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
			status.graphics.y = GAME_HEIGHT - 130;

			this.graphics.addChild(status.graphics);

			this.heroStatuses.push(status);
			this.elements.push(status);
		});
	}

	showDamage(creature, amount) {
		let display = new PIXI.Text(amount, { fill: 0x000000 });
		display.position.set(creature.cell.x * game.world.scale, creature.cell.y * game.world.scale);

		game.world.graphics.addChild(display);

		setTimeout(() => display.parent.removeChild(display), 1000);
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