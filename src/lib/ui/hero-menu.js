import UIElement from './ui-element';
import graphics from '../utils/graphics';

class HeroMenu extends UIElement {
	constructor(hero) {
		super();

		this.graphics.interactive = this.graphics.interactiveChildren = true;

		this.hero = hero;

		let curtain = graphics.rectangle(game.width, game.height, 0x000000);
		curtain.alpha = 0.5;

		this.graphics.addChild(curtain);

		this.container = graphics.rectangle(600, 400, 0x111111);
		this.container.position.set((game.width - 600) / 2, (game.height - 400) / 2);

		this.graphics.addChild(this.container);

		let closeButton = new PIXI.Container();

		let closeButtonBackground = graphics.rectangle(80, 40, 0xCC0000);
		let closeButtonText = new PIXI.Text('Close', { fontSize: 12, fill: 0xFFFFFF });

		closeButton.addChild(closeButtonBackground);
		closeButton.addChild(closeButtonText);

		this.graphics.addChild(closeButton);

		closeButton.interactive = true;
		closeButton.buttonMode = true;
		closeButton.position.set(this.container.x + 10, this.container.y + this.container.height - closeButton.height - 10);

		closeButton.on('click', event => {
			this.graphics.parent && this.graphics.parent.removeChild(this.graphics);

			// TODO: Should probably clean up events too.
			// ...
		});

		this.stats();
		this.skills();
	}

	/**
	 * Encapsulate rendering of hero stats (level, strength etc).
	 */
	stats() {
		let statsContainer = new PIXI.Container();

		let backgroundShading = graphics.rectangle(200, 380, 0x222222);
		let titleText = new PIXI.Text(this.hero.name + ' Level ' + this.hero.stats.level, { fill: 0xFFFFFF, fontSize: 14 });

		titleText.position.set(20, 20);

		let statBreakdownText = new PIXI.Text([
			{ title: 'Health', value: this.hero.stats.maxHealth },
			{ title: 'Energy', value: this.hero.stats.maxEnergy },
			{ title: 'Strength', value: this.hero.stats.strength },
			{ title: 'Accuracy', value: this.hero.stats.accuracy },
			{ title: 'Evasion', value: this.hero.stats.evasion }
		].map(line => line.title + ': ' + line.value).join('\n'), {
			fill: 0x888888,
			fontSize: 12
		});

		statBreakdownText.position.set(20, 50);

		statsContainer.addChild(backgroundShading);
		statsContainer.addChild(titleText);
		statsContainer.addChild(statBreakdownText);

		statsContainer.position.set(10, 10);

		this.container.addChild(statsContainer);
	}

	/**
	 * Encapsulate rendering of skills and skill learning tree.
	 */
	skills() {
		let skillsContainer = new PIXI.Container();
		let backgroundShading = graphics.rectangle(370, 380, 0x222222);

		skillsContainer.addChild(backgroundShading);
		skillsContainer.position.set(220, 10);

		this.container.addChild(skillsContainer);
	}
}