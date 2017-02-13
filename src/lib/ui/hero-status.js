import game from '../game';
import graphics from '../utils/graphics';
import UIElement from './ui-element';
import Bar from './bar';

export default class HeroStatus extends UIElement {
	constructor(hero) {
		super();

		this.hero = hero;

		this.background = graphics.rectangle(155, 70, 0x222222);
		this.name = new PIXI.Text(hero.def.data.name, { fill: 0xFFFFFF, fontSize: 12 });
		this.name.x = this.name.y = 10;

		this.hp = new PIXI.Text(this.hpText, { fill: 0x999999, fontSize: 11 });
		this.hp.x = 10;
		this.hp.y = 34;

		this.ep = new PIXI.Text(this.epText, { fill: 0x999999, fontSize: 11 });
		this.ep.x = 95;
		this.ep.y = 34;

		this.bar = new Bar(80, 8, 0x000000, 0xCC0000);
		this.bar.graphics.x = 10;
		this.bar.graphics.y = 52;

		this.energyBar = new Bar(50, 8, 0x000000, 0x1352A2);
		this.energyBar.graphics.x = 95;
		this.energyBar.graphics.y = 52;

		this.graphics.addChild(this.background);
		this.graphics.addChild(this.name);
		this.graphics.addChild(this.hp);
		this.graphics.addChild(this.ep);
		this.graphics.addChild(this.energyBar.graphics);
		this.graphics.addChild(this.bar.graphics);

		this.graphics.interactive = true;
		this.graphics.buttonMode = true;

		this.graphics.on('click', event => {
			this.showHeroMenu();
		});

		this.hero = hero;
	}

	showHeroMenu() {
		let heroMenu = new HeroMenu(this.hero);
		game.ui.graphics.addChild(heroMenu.graphics);
	}

	update() {
		this.hp.text = this.hpText;
		this.ep.text = this.epText;
		this.bar.percentage = this.hero.healthPercentage;
		this.energyBar.percentage = this.hero.energyPercentage;
	}

	get hpText() { return this.hero.stats.health + '/' + this.hero.stats.maxHealth + 'HP'; }
	get epText() { return this.hero.stats.energy + '/' + this.hero.stats.maxEnergy + 'EP'; }
}