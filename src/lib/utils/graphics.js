export default {
	rectangle(width, height, fill = 0x000000) {
		let graphics = new PIXI.Graphics();
		graphics.beginFill(fill);
		graphics.drawRect(0, 0, width, height);
		graphics.endFill();

		return graphics;
	},

	circle(radius, fill = 0x000000) {
		let graphics = new PIXI.Graphics();
		graphics.beginFill(fill);
		graphics.drawCircle(radius, radius, radius);
		graphics.endFill();

		return graphics;
	}
};