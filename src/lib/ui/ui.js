import game from '../game';
import graphics from '../utils/graphics';
import random from '../utils/random';
import animation from '../utils/animation';
import math from '../utils/math';
import abilities from '../world/systems/abilities';
import HeroStatus from './hero-status';
import CreatureStatus from './creature-status';
import HeroMenu from './hero-menu';
import Bar from './bar';
import VictoryScreen from './victory-screen';

export default class UI {
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

			let nameBox = graphics.rectangle(160, 26, 0x333333);
			let nameText = new PIXI.Text(hero.name, { fill: 0xEEEEEE, fontSize: 12 });

			nameText.position.set(5, 5);

			menu.addChild(nameBox);
			menu.addChild(nameText);

			hero.abilities.forEach((type, index) => {
				let ability = abilities.find(type);

				let btn = new PIXI.Container();
				let back = graphics.rectangle(160, 40, 0x222222);
				let text = new PIXI.Text(ability.name, { fill: 0xDDDDDD, fontSize: 12 });
				let icon = new PIXI.Container();

				let iconBack = graphics.rectangle(30, 30, 0x111111);
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
			let diffP = math.clamp(damage.absolute / creature.stats.maxHealth, 0, 1);

			if (damage.isHealing()) {
				// Limit the percentage change to be the missing HP for healing.
				diffP = Math.min(diffP, 1 - (creature.stats.health / creature.stats.maxHealth));
			}

			let bar = new PIXI.Container();
			let base = new Bar(barWidth, 8, 0x000000, 0xCC0000);

			base.percentage = (creature.stats.health - damage.amount) / creature.stats.maxHealth;

			let diff = graphics.rectangle(diffP * barWidth, 8, damage.isHealing() ? 0x00CC00 : 0x710000);

			if (damage.isHealing()) diff.pivot.x = diffP * barWidth;
			
			diff.x = base.foreground.width;

			bar.position.set(creature.cell.x * game.world.scale + ((game.world.scale - base.graphics.width) / 2), creature.cell.y * game.world.scale + game.world.scale - 15);
			bar.addChild(base.graphics);
			bar.addChild(diff);

			game.world.layer('ui').addChild(bar);

			animation.tween(diff).wait(300).to({ width: 0 }, 500, animation.ease('sineInOut')).wait(500).call(() => bar.parent && bar.parent.removeChild(bar));

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
			let display = new PIXI.Text(body, { fill: color ? color: 0xFFFFFF, stroke: 0x222222, strokeThickness: 2, fontSize: 19, fontFamily: 'Averia Serif Libre', align: 'center' });

			let offset = game.world.scale / 3;

			let x = (cell.x * game.world.scale + ((game.world.scale - display.width) / 2)) + random.between(-offset, offset);
			let y = (cell.y * game.world.scale + ((game.world.scale - display.height) / 2)) + random.between(-offset, offset);

			display.alpha = 0;
			display.position.set(x, y - 20);

			game.world.layer('ui').addChild(display);

			animation.tween(display).to({ alpha: 1, y }, 250, animation.ease('bounceOut')).wait(1000).to({ alpha: 0 }, 100).call(() => {
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
			let screen = graphics.rectangle(game.width, game.height, 0x000000);

			screen.alpha = 0;

			this.graphics.addChild(screen);

			animation.tween(screen).to({ alpha: 1 }, duration).call(resolve).to({ alpha: 0 }, duration).call(() => {
				screen.parent && screen.parent.removeChild(screen);
			});
		});
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

		let background = graphics.rectangle(widest + (padding * 2), y + (padding * 2) - lineSpacing, 0x222222);
		this.graphics.addChildAt(background, 0);
	}
}