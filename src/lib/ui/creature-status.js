import UIElement from './ui-element';
import Bar from './bar';
import graphics from '../utils/graphics';

export default class CreatureStatus extends UIElement {
	constructor(creature) {
		super();

		this.creature = creature;

		this.background = graphics.rectangle(160, 95, 0x333333);
		this.name = new PIXI.Text(creature.name, { fill: 0xFFFFFF, fontSize: 12, fontWeight: 'bold' });
		this.name.y = 10;
		this.hp = new PIXI.Text(this.hpText, { fill: 0xFFFFFF, fontSize: 12 });
		this.hp.y = 30;

		this.stats = new PIXI.Text('STR: ' + creature.stats.strength + ' EVA: ' + creature.stats.evasion + ' ACC: ' + creature.stats.accuracy, { fill: 0xAAAAAA, fontSize: 10 });
		this.stats.y = 70;

		this.name.x = this.hp.x = this.stats.x = 10;

		let levelBox = graphics.circle(12, 0x111111);
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