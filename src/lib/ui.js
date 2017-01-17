class UI {
	constructor() {
		this.graphics = new PIXI.Container();
		this.elements = [];
		this.heroStatuses = [];
		this.creatureStatus = null;

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

			menu.position.set(20, 110);

			let nameBox = Utils.Graphics.rectangle(160, 26, 0x333333);
			let nameText = new PIXI.Text(hero.name, { fill: 0xEEEEEE, fontSize: 12 });

			nameText.position.set(5, 5);

			menu.addChild(nameBox);
			menu.addChild(nameText);

			hero.abilities.forEach((type, index) => {
				let ability = Abilities.find(type);

				let btn = new PIXI.Container();
				let back = Utils.Graphics.rectangle(160, 40, 0x222222);
				let text = new PIXI.Text(ability.name, { fill: 0xDDDDDD, fontSize: 12 });
				let icon = new PIXI.Container();

				let iconBack = Utils.Graphics.rectangle(30, 30, 0x111111);
				icon.addChild(iconBack);

				if (ability.icon) {
					let iconImage = PIXI.Sprite.fromImage(ability.icon);
					iconImage.width = iconImage.height = 30;
					icon.addChild(iconImage);
				}

				text.position.set(45, 12);
				icon.position.set(5, 5);

				btn.addChild(back);
				btn.addChild(icon);
				btn.addChild(text);

				btn.y = 31 + index * 45;

				btn.interactive = true;
				btn.buttonMode = true;

				let tip = null;

				btn.on('mouseover', event => {
					let tipLines = ability.tip(hero);

					if (tipLines) {
						tip = new Tip(tipLines);

						tip.graphics.position.set(btn.x + btn.width + 10, btn.y);
						menu.addChild(tip.graphics);
					}
				});

				btn.on('mouseout', event => {
					if (tip && tip.graphics.parent) {
						tip.graphics.parent.removeChild(tip.graphics);
						tip = null;
					}
				});

				btn.on('click', event => {
					resolve(ability);
					menu.parent && menu.parent.removeChild(menu);

					if (tip && tip.graphics.parent) {
						tip.graphics.parent.removeChild(tip.graphics);
						tip = null;
					}
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

			status.graphics.x = 20 + (index * 125);
			status.graphics.y = 20;

			this.graphics.addChild(status.graphics);

			this.heroStatuses.push(status);
			this.elements.push(status);
		});
	}

	showDamage(creature, damage) {
		this.worldText(creature.cell, Math.abs(damage.amount).toString(), damage.amount > 0 ? 0x000000 : 0x00CC00);
	}

	/**
	 * Show some in-world text at a specificed cell.
	 * 
	 * @param {Cell} cell The cell to position the text on.
	 * @param {String} body The text body.
	 * @param {Number} color The text color.
	 * 
	 * @return {Promise}
	 */
	worldText(cell, body, color) {
		return new Promise((resolve, reject) => {
			let display = new PIXI.Text(body, { fill: color ? color: 0xFFFFFF, stroke: 0x222222, strokeThickness: 2, fontSize: 16, align: 'center' });

			let offset = game.world.scale / 3;

			let x = (cell.x * game.world.scale + ((game.world.scale - display.width) / 2)) + Utils.Random.between(-offset, offset);
			let y = (cell.y * game.world.scale + ((game.world.scale - display.height) / 2)) + Utils.Random.between(-offset, offset);

			display.alpha = 0;
			display.position.set(x, y - 20);

			game.world.layer('ui').addChild(display);

			createjs.Tween.get(display).to({ alpha: 1, y }, 250, createjs.Ease.bounceOut).wait(1000).to({ alpha: 0 }, 100).call(() => {
				display.parent && display.parent.removeChild(display);
				resolve();
			});
		});
	}

	showCreatureStatus(creature) {
		this.hideCreatureStatus();

		this.creatureStatus = new CreatureStatus(creature);
		this.creatureStatus.graphics.position.set(creature.cell.x * game.world.scale, (creature.cell.y + 1) * game.world.scale);
		
		this.elements.push(this.creatureStatus);

		game.world.layer('ui').addChild(this.creatureStatus.graphics);
	}

	showVictoryScreen(result) {
		return new Promise((resolve, reject) => {
			let screen = new VictoryScreen(result);

			this.graphics.addChild(screen.graphics);

			screen.on('close', () => resolve());
		});
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

class HeroStatus extends UIElement {
	constructor(hero) {
		super();

		this.background = Utils.Graphics.rectangle(120, 70, 0x222222);
		this.name = new PIXI.Text(hero.def.data.name, { fill: 0xFFFFFF, fontSize: 12 });
		this.name.x = this.name.y = 10;

		this.hp = new PIXI.Text(hero.stats.health + '/' + hero.stats.maxHealth + 'HP', { fill: 0xFFFFFF, fontSize: 11 });
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
		this.hp.text = this.hero.stats.health + '/' + this.hero.stats.maxHealth + 'HP';
		this.bar.percentage = this.hero.healthPercentage;
	}
}

class CreatureStatus extends UIElement {
	constructor(creature) {
		super();

		this.creature = creature;

		this.background = Utils.Graphics.rectangle(160, 95, 0x333333);
		this.name = new PIXI.Text(creature.name, { fill: 0xFFFFFF, fontSize: 12, fontWeight: 'bold' });
		this.name.y = 10;
		this.hp = new PIXI.Text(creature.stats.health + '/' + creature.stats.maxHealth + 'HP', { fill: 0xFFFFFF, fontSize: 12 });
		this.hp.y = 30;

		this.stats = new PIXI.Text('STR: ' + creature.stats.strength + ' EVA: ' + creature.stats.evasion + ' ACC: ' + creature.stats.accuracy, { fill: 0xAAAAAA, fontSize: 10 });
		this.stats.y = 70;

		this.name.x = this.hp.x = this.stats.x = 10;

		let levelBox = Utils.Graphics.circle(12, 0x111111);
		let levelText = new PIXI.Text(creature.stats.level.toString(), { fill: 0xCCCCCC, fontSize: 12, fontWeight: 'bold' });

		levelBox.position.set(140, -5);
		levelText.position.set(140 + ((levelBox.width - levelText.width) / 2), 0);

		this.graphics.addChild(this.background);
		this.graphics.addChild(this.name);
		this.graphics.addChild(this.hp);
		this.graphics.addChild(this.stats);
		this.graphics.addChild(levelBox);
		this.graphics.addChild(levelText);

		this.bar = new Bar(140, 10, 0x252525, 0xFF0000);
		this.bar.graphics.x = 10;
		this.bar.graphics.y = 50;

		this.graphics.addChild(this.bar.graphics);
	}

	update() {
		this.hp.text = this.creature.stats.health + '/' + this.creature.stats.maxHealth + 'HP';
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

class VictoryScreen extends EventEmitter {
	constructor(result) {
		super();

		this.result = result;
		this.graphics = new PIXI.Container();
		this.graphics.interactive = true;
		this.graphics.interactiveChildren = true;

		this.curtain = Utils.Graphics.rectangle(game.width, game.height, 0x000000);
		this.curtain.alpha = 0.6;

		this.modal = new PIXI.Container();
		
		this.modalBackground = Utils.Graphics.rectangle(300, 400, 0x111111);
		this.modal.addChild(this.modalBackground);

		this.modal.position.set((game.width - 300) / 2, (game.height - 400) / 2);

		this.graphics.addChild(this.curtain);
		this.graphics.addChild(this.modal);

		this.okButton = new PIXI.Container();
		this.okButton.interactive = this.okButton.buttonMode = true;
		this.okButton.position.set(20, 340);
		this.okButton.addChild(Utils.Graphics.rectangle(260, 40, 0xAAAAAA));
		
		let okText = new PIXI.Text('Continue', { fill: 0x000000, fontSize: 14 });
		okText.position.set(10, 10);

		let text = new PIXI.Text('Victory! Earned ' + result.exp + ' EXP.', { fill: 0xFFFFFF, fontSize: 16 });
		text.position.set(20, 20);
		this.modal.addChild(text);

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

class Tip {
	constructor(lines, padding = 10, lineSpacing = 10) {
		this.graphics = new PIXI.Container();

		let widest = 0;
		let y = 0;

		lines.forEach(line => {
			let text = new PIXI.Text(line.text, line.style);
			widest = Math.max(widest, text.width);

			this.graphics.addChild(text);
			text.position.set(padding, padding + y);

			y += text.height + lineSpacing;
		});

		let background = Utils.Graphics.rectangle(widest + (padding * 2), y + (padding * 2) - lineSpacing, 0x222222);
		this.graphics.addChildAt(background, 0);
	}
}