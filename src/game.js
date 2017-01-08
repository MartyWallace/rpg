const canvas = document.querySelector('canvas');
const stage = new PIXI.Container();

const renderer = PIXI.autoDetectRenderer(GAME_WIDTH, GAME_HEIGHT, {
	view: canvas,
	backgroundColor: 0xAAAAAA
});

class Game {
	constructor() {
		this.world = null;
		this.ui = null;
	}

	init() {
		this.world = new World(DRAW_SCALE);
		this.ui = new UI();

		stage.addChild(this.world.graphics);
		stage.addChild(this.ui.graphics);
		
		this.world.load(LEVELS[1], {
			x: 1, y: 3,
			heroes: [
				{ name: 'marty', type: 'warrior', attrs: { color: 0xFFFFFF } },
				{ name: 'carlie', type: 'archer', attrs: { color: 0xFFFFFF } },
				{ name: 'mia', type: 'baby', attrs: { color: 0xFFFFFF } }
			]
		});

		this.update();
	}

	update() {
		this.world.update();
		this.ui.update();
		
		renderer.render(stage);

		window.requestAnimationFrame(this.update.bind(this));
	}

	get width() { return GAME_WIDTH; }
	get height() { return GAME_HEIGHT; }
}

const game = new Game();