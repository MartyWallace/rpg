const renderer = PIXI.autoDetectRenderer(840, 560, {
	view: document.querySelector('canvas')
});

const stage = new PIXI.Container();

const game = {
	init() {
		this.update();
	},

	update() {
		renderer.render(stage);

		window.requestAnimationFrame(this.update.bind(this));
	}
};