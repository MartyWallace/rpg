import config from '../config';
import library from './library';
import storage from './utils/storage';
import World from './world/world';
import UI from './ui/ui';

export const canvas = document.querySelector('canvas');
export const stage = new PIXI.Container();

export const renderer = PIXI.autoDetectRenderer(config.GAME_WIDTH, config.GAME_HEIGHT, {
	view: canvas,
	backgroundColor: 0x000000,
	resolution: 1,
	antialiasing: true
});

let initialized = false;
let world = null;
let ui = null;

export default {
	init() {
		if (!initialized) {
			initialized = true;

			library.load().then(() => {
				world = new World(config.DRAW_SCALE);
				ui = new UI();

				stage.addChild(world.graphics);
				stage.addChild(ui.graphics);
				
				world.load(config.LEVELS[1], {
					x: 1, y: 3,
					heroes: storage.load('heroes', [
						{ name: 'Marty', attrs: { color: 0xFFFFFF, texture: '/textures/hero1.png' }, stats: { health: 36, maxHealth: 36, strength: 50, evasion: 9, accuracy: 20 }, abilities: ['attack', 'skip'] },
						{ name: 'Carlie', attrs: { color: 0xFFFFFF, texture: '/textures/hero1.png' }, stats: { health: 27, maxHealth: 27, strength: 50, evasion: 9, accuracy: 24 }, abilities: ['attack', 'bandage', 'skip',] },
						{ name: 'Mia', attrs: { color: 0xFFFFFF, texture: '/textures/hero1.png' }, stats: { health: 21, maxHealth: 21, strength: 50, evasion: 12, accuracy: 19 }, abilities: ['attack', 'skip'] }
					])
				});

				this.update();
			});
		} else {
			throw new Error(`You can only initialize the game once.`);
		}
	},

	update() {
		if (world) world.update();
		if (ui) ui.update();
		if (renderer) renderer.render(stage);

		if (window) {
			window.requestAnimationFrame(this.update.bind(this));
		}
	},

	/** @type {number} */
	get width() { return config.GAME_WIDTH; },

	/** @type {number} */
	get height() { return config.GAME_HEIGHT; },

	/** @type {World} */
	get world() { return world; },

	/** @type {UI} */
	get ui() { return ui; }
}