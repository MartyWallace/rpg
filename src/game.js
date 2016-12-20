const view = document.querySelector('canvas');
const renderer = PIXI.autoDetectRenderer(840, 560, { view, backgroundColor: 0xEEEEEE });
const stage = new PIXI.Container();

const game = {
	world: null,

	init() {
		this.world = new World(40, 40);
		stage.addChild(this.world.graphics);
		
		this.world.load({
			beings: [
				{ type: 'Wall', x: 5, y: 5 },
				{ type: 'Wall', x: 5, y: 6 },
				{ type: 'Wall', x: 5, y: 7 },
				{ type: 'Hero', x: 4, y: 8 }
			]
		});

		view.addEventListener('click', event => {
			let bounds = view.getBoundingClientRect();
			this.world.handleClick(event.pageX - bounds.left, event.pageY - bounds.top);
		});

		this.update();
	},

	update() {
		this.world.update();

		renderer.render(stage);

		window.requestAnimationFrame(this.update.bind(this));
	}
};