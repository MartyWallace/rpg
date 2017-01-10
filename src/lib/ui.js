class UI {
	constructor() {
		this.graphics = new PIXI.Container();
		this.elements = [];
		this.heroStatuses = [];
		this.creatureStatus = null;

		this.hud = new HUD();
		this.hud.graphics.y = GAME_HEIGHT;
		this.graphics.addChild(this.hud.graphics);

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
		return new Promise(resolve => {
			let menu = new PIXI.Container();

			let abilities = [{ type: 'attack' }].concat(hero.abilities);
			abilities.push({ type: 'skip' });

			menu.position.set(100, 100);

			abilities.forEach((ability, index) => {
				let btn = new PIXI.Container();
				let back = Utils.Graphics.rectangle(160, 30, 0x0000CC);
				let text = new PIXI.Text(ability.type, { fill: 0xFFFFFF, fontSize: 14 });

				btn.addChild(back);
				btn.addChild(text);

				btn.y = index * 30;

				btn.interactive = true;
				btn.buttonMode = true;

				btn.on('click', event => {
					resolve(ability);
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

			status.graphics.x = 20 + (index * 130);
			status.graphics.y = 30;

			this.hud.graphics.addChild(status.graphics);

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

	transition(duration) {
		return new Promise((resolve, reject) => {
			let screen = Utils.Graphics.rectangle(game.width, game.height, 0x000000);

			screen.alpha = 0;

			this.graphics.addChild(screen);

			createjs.Tween.get(screen).to({ alpha: 1 }, duration).call(resolve).to({ alpha: 0 }, duration).call(() => {
				screen.parent && screen.parent.removeChild(screen);
			});
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

class HUD {
	constructor() {
		this.graphics = new PIXI.Graphics();
		this.graphics.addChild(Utils.Graphics.rectangle(GAME_WIDTH, HUD_HEIGHT, 0x333333));
	}
}

class HeroStatus extends UIElement {
	constructor(hero) {
		super();

		this.background = Utils.Graphics.rectangle(120, 70, 0x222222);
		this.name = new PIXI.Text(hero.def.data.name, { fill: 0xFFFFFF, fontSize: 12 });
		this.name.x = this.name.y = 10;

		this.hp = new PIXI.Text(hero.stats.health + '/' + hero.stats.maxhealth + 'HP', { fill: 0xFFFFFF, fontSize: 11 });
		this.hp.x = 10;
		this.hp.y = 30;

		this.bar = new Bar(100, 10, 0x000000, 0xCC0000);
		this.bar.graphics.x = 10;
		this.bar.graphics.y = 50;

		this.graphics.addChild(this.background);
		this.graphics.addChild(this.name);
		this.graphics.addChild(this.hp);
		this.graphics.addChild(this.bar.graphics);

		this.hero = hero;
	}

	update() {
		this.hp.text = this.hero.stats.health + '/' + this.hero.stats.maxhealth + 'HP';
		this.bar.percentage = this.hero.healthPercentage;
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