const DRAW_SCALE = 60;

const view = document.querySelector('canvas');
const renderer = PIXI.autoDetectRenderer(DRAW_SCALE * 16, DRAW_SCALE * 12, { view, backgroundColor: 0xEEEEEE });
const stage = new PIXI.Container();

const game = {
	world: null,
	hud: null,

	init() {
		this.world = new World(20, 24, DRAW_SCALE);
		this.hud = new HUD(this.world);

		stage.addChild(this.world.graphics);
		stage.addChild(this.hud.graphics);
		
		this.world.load({
			width: 30,
			height: 20,
			beings: [
				{ type: 'Wall', x: 5, y: 5 },
				{ type: 'Wall', x: 5, y: 6 },
				{ type: 'Wall', x: 5, y: 7 },
				{ type: 'Wall', x: 6, y: 7 },
				{ type: 'Wall', x: 22, y: 12 }
			]
		}, {
			x: 1,
			y: 3,
			heroes: [
				{ name: 'marty', type: 'warrior' },
				{ name: 'carlie', type: 'archer' },
				{ name: 'mia', type: 'baby' },
				{ name: 'bradley', type: 'egg' }
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