const DRAW_SCALE = 60;

const view = document.querySelector('canvas');
const renderer = PIXI.autoDetectRenderer(DRAW_SCALE * 16, DRAW_SCALE * 12, { view, backgroundColor: 0xEEEEEE });
const stage = new PIXI.Container();

const game = {
	world: null,

	init() {
		this.world = new World(20, 24, DRAW_SCALE);
		stage.addChild(this.world.graphics);
		
		this.world.load({
			width: 20,
			height: 20,
			beings: [
				{ type: 'Wall', x: 5, y: 5 },
				{ type: 'Wall', x: 5, y: 6 },
				{ type: 'Wall', x: 5, y: 7 },
				{ type: 'Wall', x: 6, y: 7 },
				{ type: 'Wall', x: 7, y: 7 }
			]
		}, {
			x: 1,
			y: 3,
			heroes: [
				{ name: 'marty', type: 'warrior' },
				{ name: 'carlie', type: 'archer' },
				{ name: 'mia', type: 'baby' }
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