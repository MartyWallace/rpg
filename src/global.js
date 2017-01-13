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
		{ destination: { level: 1, x: 4, y: 13 }, x: 4, y: 0 }
	]
}, {
	width: 17,
	height: 15,
	beings: [
		{ type: 'Wall', x: 9, y: 5 },
		{ type: 'Wall', x: 9, y: 6 },
		{ type: 'Wall', x: 10, y: 5 },
		{ type: 'Wall', x: 10, y: 6 },
		{ type: 'Wall', x: 11, y: 5 },
		{ type: 'Wall', x: 11, y: 6 }
	],
	enemies: [
		{ type: 'Skeleton', level: [1, 2] }
	],
	doors: [
		{ destination: { level: 0, x: 4, y: 1 }, x: 4, y: 14 },
		{ destination: { level: 2, x: 3, y: 3 }, x: 0, y: 5 }
	]
}, {
	width: 5,
	height: 5,
	beings: [],
	enemies: [
		{ type: 'Skeleton', level: [1, 2] }
	],
	doors: [
		{ destination: { level: 1, x: 1, y: 5 }, x: 4, y: 3 }
	]
}];