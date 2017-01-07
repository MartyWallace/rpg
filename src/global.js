const DRAW_SCALE = 60;
const GAME_WIDTH = 16 * DRAW_SCALE;
const GAME_HEIGHT = 12 * DRAW_SCALE;

const LEVELS = [{
	width: 30,
	height: 20,
	beings: [
		{ type: 'Wall', x: 5, y: 5 },
		{ type: 'Wall', x: 5, y: 6 },
		{ type: 'Wall', x: 5, y: 7 },
		{ type: 'Wall', x: 6, y: 7 },
		{ type: 'Wall', x: 22, y: 7 },
		{ type: 'Wall', x: 23, y: 7 },
		{ type: 'Wall', x: 24, y: 7 },
		{ type: 'Wall', x: 25, y: 7 }
	],
	enemies: [
		{ type: 'Skeleton', level: [1, 2] }
	],
	doors: [
		{ destination: 0, x: 4, y: 0 }
	]
}];