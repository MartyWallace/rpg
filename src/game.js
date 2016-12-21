const game = new Vue({
	el: 'main',

	data: {
		canvas: null,
		renderer: null,
		stage: new PIXI.Container(),
		world: new World(20, 24, DRAW_SCALE)
	},

	methods: {
		update() {
			this.world.update();

			this.renderer.render(this.stage);

			window.requestAnimationFrame(this.update.bind(this));
		},

		handleMouse(event) {
			let bounds = this.canvas.getBoundingClientRect();
			let x = event.pageX - bounds.left;
			let y = event.pageY - bounds.top;

			if (event.type === 'click') this.world.handleClick(x, y);

			if (event.type === 'mousemove') {
				let cell = this.world.grid.find(x, y, DRAW_SCALE);
			}
		}
	},

	computed: {
		heroes() {
			return this.world.party ? this.world.party.heroes : [];
		}
	},

	mounted() {
		this.canvas = this.$el.querySelector('canvas');

		this.renderer = PIXI.autoDetectRenderer(DRAW_SCALE * 12, DRAW_SCALE * 10, {
			view: this.canvas,
			backgroundColor: 0xAAAAAA
		});

		this.stage.addChild(this.world.graphics);
		
		this.world.load(LEVELS[0], {
			x: 1,
			y: 3,
			heroes: [
				{ name: 'marty', type: 'warrior', attrs: { color: 0xFFFFFF } },
				{ name: 'carlie', type: 'archer', attrs: { color: 0xFFFFFF } },
				{ name: 'mia', type: 'baby', attrs: { color: 0xFFFFFF } }
			]
		});

		this.canvas.addEventListener('click', event => this.handleMouse(event));
		this.canvas.addEventListener('mousemove', event => this.handleMouse(event));

		this.world.on('interact', cell => {
			console.log(cell);
		});

		this.update();
	}
});