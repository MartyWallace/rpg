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

				btn.y = 31 + index * 40;

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

			status.graphics.x = 20 + (index * 160);
			status.graphics.y = 20;

			this.graphics.addChild(status.graphics);

			this.heroStatuses.push(status);
			this.elements.push(status);
		});
	}

	showDamage(creature, damage) {
		return new Promise((resolve, reject) => {
			let barWidth = 50;
			let diffP = Utils.Math.clamp(damage.absolute / creature.stats.maxHealth, 0, 1);

			if (damage.isHealing()) {
				// Limit the percentage change to be the missing HP for healing.
				diffP = Math.min(diffP, 1 - (creature.stats.health / creature.stats.maxHealth));
			}

			let bar = new PIXI.Container();
			let base = new Bar(barWidth, 8, 0x000000, 0xCC0000);

			base.percentage = (creature.stats.health - damage.amount) / creature.stats.maxHealth;

			let diff = Utils.Graphics.rectangle(diffP * barWidth, 8, damage.isHealing() ? 0x00CC00 : 0x710000);

			if (damage.isHealing()) diff.pivot.x = diffP * barWidth;
			
			diff.x = base.foreground.width;

			bar.position.set(creature.cell.x * game.world.scale + ((game.world.scale - base.graphics.width) / 2), creature.cell.y * game.world.scale + game.world.scale - 15);
			bar.addChild(base.graphics);
			bar.addChild(diff);

			game.world.layer('ui').addChild(bar);

			Utils.Animation.tween(diff).wait(300).to({ width: 0 }, 500, Utils.Animation.ease('sineInOut')).wait(500).call(() => bar.parent && bar.parent.removeChild(bar));

			this.worldText(creature.cell, damage.absolute.toString(), damage.isHealing() ? 0x00CC00 : 0xFFFFFF).then(() => {
				resolve();
			});
		});
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

			Utils.Animation.tween(display).to({ alpha: 1, y }, 250, Utils.Animation.ease('bounceOut')).wait(1000).to({ alpha: 0 }, 100).call(() => {
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

	showVictoryScreen(result, heroes) {
		return new Promise((resolve, reject) => {
			let screen = new VictoryScreen(result, heroes);

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

			Utils.Animation.tween(screen).to({ alpha: 1 }, duration).call(resolve).to({ alpha: 0 }, duration).call(() => {
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

		this.hero = hero;

		this.background = Utils.Graphics.rectangle(155, 70, 0x222222);
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

		this.hero = hero;
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

class CreatureStatus extends UIElement {
	constructor(creature) {
		super();

		this.creature = creature;

		this.background = Utils.Graphics.rectangle(160, 95, 0x333333);
		this.name = new PIXI.Text(creature.name, { fill: 0xFFFFFF, fontSize: 12, fontWeight: 'bold' });
		this.name.y = 10;
		this.hp = new PIXI.Text(this.hpText, { fill: 0xFFFFFF, fontSize: 12 });
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
		this.hp.text = this.hpText;
		this.bar.percentage = this.creature.healthPercentage;
	}

	get hpText() {
		if (this.creature.dead) return 'DEAD';
		return this.creature.stats.health + '/' + this.creature.stats.maxHealth + 'HP';
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
	constructor(result, heroes) {
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
					Utils.Animation.tween(bar).to({ percentage: 1 }, 1000, Utils.Animation.ease('sineInOut')).wait(200).call(() => {
						text.text = hero.name + ' - Level ' + hero.stats.level;
						bar.percentage = 0;

						Utils.Animation.tween(bar).to({ percentage: hero.levelling.exp / hero.levelling.nextLevel }, 1000, Utils.Animation.ease('sineInOut'));
					});
				} else {
					Utils.Animation.tween(bar).to({ percentage: hero.levelling.exp / hero.levelling.nextLevel }, 1000, Utils.Animation.ease('sineInOut'));
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