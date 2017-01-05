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

			options.forEach((option, index) => {
				let btn = new PIXI.Container();
				let back = new PIXI.Graphics();
				let text = new PIXI.Text(option, { fill: 0xFFFFFF });

				back.beginFill(0x0000CC);
				back.drawRect(0, 0, 160, 30);
				back.endFill();

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

			status.graphics.x = 50 + (index * 150);
			status.graphics.y = GAME_HEIGHT - 100;

			this.graphics.addChild(status.graphics);

			this.heroStatuses.push(status);
			this.elements.push(status);
		});
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

		this.background = new PIXI.Graphics();
		this.background.beginFill(0x0000FF);
		this.background.drawRect(0, 0, 140, 60);
		this.background.endFill();

		this.name = new PIXI.Text(hero.def.data.name, { fill: 0xFFFFFF });

		this.hp = new PIXI.Text(hero.stats.health + '/' + hero.stats.maxhealth + 'HP', { fill: 0xFFFFFF });
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