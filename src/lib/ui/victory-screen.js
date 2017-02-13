import game from '../game';
import graphics from '../utils/graphics';
import animation from '../utils/animation';
import Bar from './bar';

export default class VictoryScreen extends EventEmitter {
	constructor(result, heroes) {
		super();

		this.result = result;
		this.graphics = new PIXI.Container();
		this.graphics.interactive = true;
		this.graphics.interactiveChildren = true;

		this.curtain = graphics.rectangle(game.width, game.height, 0x000000);
		this.curtain.alpha = 0.6;

		this.modal = new PIXI.Container();
		
		this.modalBackground = graphics.rectangle(300, 400, 0x111111);
		this.modal.addChild(this.modalBackground);

		this.modal.position.set((game.width - 300) / 2, (game.height - 400) / 2);

		this.graphics.addChild(this.curtain);
		this.graphics.addChild(this.modal);

		this.okButton = new PIXI.Container();
		this.okButton.interactive = this.okButton.buttonMode = true;
		this.okButton.position.set(20, 340);
		this.okButton.addChild(graphics.rectangle(260, 40, 0xAAAAAA));
		
		let okText = new PIXI.Text('Continue', { fill: 0x000000, fontSize: 14 });
		okText.position.set(10, 10);

		let text = new PIXI.Text('Victory! Earned ' + result.exp + ' EXP.', { fill: 0xFFFFFF, fontSize: 16 });
		text.position.set(20, 20);
		this.modal.addChild(text);

		let barY = 100;

		heroes.forEach(hero => {
			let text = new PIXI.Text(hero.name + ' - Level ' + hero.stats.level, { fontSize: 12, fill: 0xEEEEEE });
			let bar = new Bar(260, 12, 0x444444, 0xEEEEEE);

			text.position.set(20, barY - 20);
			bar.graphics.position.set(20, barY);
			bar.percentage = hero.levelling.exp / hero.levelling.nextLevel;

			this.modal.addChild(bar.graphics);
			this.modal.addChild(text);

			barY += 50;

			if (!hero.dead) {
				let levelsAdvanced = hero.addExp(result.exp);

				if (levelsAdvanced > 0) {
					animation.tween(bar).to({ percentage: 1 }, 1000, animation.ease('sineInOut')).wait(200).call(() => {
						text.text = hero.name + ' - Level ' + hero.stats.level;
						bar.percentage = 0;

						animation.tween(bar).to({ percentage: hero.levelling.exp / hero.levelling.nextLevel }, 1000, animation.ease('sineInOut'));
					});
				} else {
					animation.tween(bar).to({ percentage: hero.levelling.exp / hero.levelling.nextLevel }, 1000, animation.ease('sineInOut'));
				}
			}
		});

		this.okButton.addChild(okText);

		let click = event => {
			this.graphics.parent && this.graphics.parent.removeChild(this.graphics);
			this.emit('close');

			this.okButton.off('click', click);
		}

		this.okButton.on('click', click);

		this.modal.addChild(this.okButton);
	}
}