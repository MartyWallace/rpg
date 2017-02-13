import config from '../config';
import World from './world/world';
import UI from './ui/ui';

const canvas = document.querySelector('canvas');
const stage = new PIXI.Container();

const renderer = PIXI.autoDetectRenderer(config.GAME_WIDTH, config.GAME_HEIGHT, {
	view: canvas,
	backgroundColor: 0x000000,
	resolution: 1,
	antialiasing: true
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

				this.world = new World(config.DRAW_SCALE);
				this.ui = new UI();

				stage.addChild(this.world.graphics);
				stage.addChild(this.ui.graphics);
				
				this.world.load(config.LEVELS[1], {
					x: 1, y: 3,
					heroes: [
						{ name: 'Marty', attrs: { color: 0xFFFFFF, texture: '/textures/hero1.png' }, stats: { health: 36, maxHealth: 36, strength: 50, evasion: 9, accuracy: 20 }, abilities: ['attack', 'skip'] },
						{ name: 'Carlie', attrs: { color: 0xFFFFFF, texture: '/textures/hero1.png' }, stats: { health: 27, maxHealth: 27, strength: 50, evasion: 9, accuracy: 24 }, abilities: ['attack', 'bandage', 'skip',] },
						{ name: 'Mia', attrs: { color: 0xFFFFFF, texture: '/textures/hero1.png' }, stats: { health: 21, maxHealth: 21, strength: 50, evasion: 12, accuracy: 19 }, abilities: ['attack', 'skip'] }
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

	get width() { return config.GAME_WIDTH; }
	get height() { return config.GAME_HEIGHT; }
}

export default new Game();