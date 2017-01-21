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
						{ name: 'Marty', attrs: { color: 0xFFFFFF, texture: '/textures/male-1.png' }, stats: { health: 36, maxHealth: 36, strength: 50, evasion: 9, accuracy: 20 }, abilities: ['attack', 'skip'] },
						{ name: 'Carlie', attrs: { color: 0xFFFFFF, texture: '/textures/male-2.png' }, stats: { health: 27, maxHealth: 27, strength: 50, evasion: 9, accuracy: 24 }, abilities: ['attack', 'bandage', 'skip',] },
						{ name: 'Mia', attrs: { color: 0xFFFFFF, texture: '/textures/female.png' }, stats: { health: 21, maxHealth: 21, strength: 50, evasion: 12, accuracy: 19 }, abilities: ['attack', 'skip'] }
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