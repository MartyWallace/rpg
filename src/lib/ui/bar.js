import graphics from '../utils/graphics';
import math from '../utils/math';

export default class Bar {
	constructor(width, height, background = 0x000000, foreground = 0xFFFFFF) {
		this.graphics = new PIXI.Container();

		this.background = graphics.rectangle(width, height, background);
		this.foreground = graphics.rectangle(width, height, foreground);

		this.graphics.addChild(this.background);
		this.graphics.addChild(this.foreground);

		this._percentage = 1.0;
	}

	set percentage(value) {
		this._percentage = math.clamp(value, 0, 1);
		this.foreground.scale.x = this._percentage;
	}

	get percentage() {
		return this._percentage;
	}
}