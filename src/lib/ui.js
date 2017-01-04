class UI {
	constructor() {
		this.graphics = new PIXI.Container();

		game.world.on('startBattle', battle => {
			// Add battle based UI components.
			// ...
		});
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
}