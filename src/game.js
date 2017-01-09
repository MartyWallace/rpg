const canvas = document.querySelector('canvas');
const stage = new PIXI.Container();

const renderer = PIXI.autoDetectRenderer(GAME_WIDTH, GAME_HEIGHT, {
	view: canvas,
	backgroundColor: 0x000000
});

class Game {
	constructor() {
		this.textures = { };
		this.world = null;
		this.ui = null;
	}

	init() {
		PIXI.loader
			.add('/textures/hero1.png')
			.add('/textures/skeleton.png')
			.load(() => {
				this.textures = {
					hero1: new PIXI.Texture.fromImage('/textures/hero1.png'),
					skeleton: new PIXI.Texture.fromImage('/textures/skeleton.png')
				};

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
			});
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