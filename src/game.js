const view = document.querySelector('canvas');
const renderer = PIXI.autoDetectRenderer(840, 560, { view, backgroundColor: 0xEEEEEE });
const stage = new PIXI.Container();

const game = {
	world: null,

	init() {
		this.world = new World();
		stage.addChild(this.world.graphics);

		this.update();
	},

	update() {
		this.world.update();

		renderer.render(stage);

		window.requestAnimationFrame(this.update.bind(this));
	}
};