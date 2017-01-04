const canvas = document.querySelector('canvas');
const stage = new PIXI.Container();

const renderer = PIXI.autoDetectRenderer(GAME_WIDTH, GAME_HEIGHT, {
	view: canvas,
	backgroundColor: 0xAAAAAA
});

const game = {
	world: null,

	init() {
		this.world = new World(20, 24, DRAW_SCALE);

		stage.addChild(this.world.graphics);
		
		this.world.load(LEVELS[0], {
			x: 1,
			y: 3,
			heroes: [
				{ name: 'marty', type: 'warrior', attrs: { color: 0xFFFFFF } },
				{ name: 'carlie', type: 'archer', attrs: { color: 0xFFFFFF } },
				{ name: 'mia', type: 'baby', attrs: { color: 0xFFFFFF } }
			]
		});

		canvas.addEventListener('click', event => this.handleMouse(event));
		canvas.addEventListener('mousemove', event => this.handleMouse(event));

		this.world.on('interact', cell => {
			console.log(cell);
		});

		this.update();
	},

	update() {
		this.world.update();
		renderer.render(stage);

		window.requestAnimationFrame(this.update.bind(this));
	},

	handleMouse(event) {
		let bounds = canvas.getBoundingClientRect();

		let cell = this.world.grid.find(
			event.pageX - bounds.left - this.world.graphics.x,
			event.pageY - bounds.top - this.world.graphics.y,
			DRAW_SCALE
		);

		if (event.type === 'click') this.world.handleClick(cell);

		if (event.type === 'mousemove') {
			//
		}
	}
}