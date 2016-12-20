const game = new Vue({
	el: 'main',

	data: {
		renderer: null,
		stage: new PIXI.Container(),
		world: new World(20, 24, DRAW_SCALE)
	},

	methods: {
		update() {
			this.world.update();

			this.renderer.render(this.stage);

			window.requestAnimationFrame(this.update.bind(this));
		}
	},

	computed: {
		heroes() {
			return this.world.party ? this.world.party.heroes : [];
		}
	},

	mounted() {
		let canvas = this.$el.querySelector('canvas');

		this.renderer = PIXI.autoDetectRenderer(DRAW_SCALE * 12, DRAW_SCALE * 10, {
			view: canvas,
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

		canvas.addEventListener('click', event => {
			let bounds = canvas.getBoundingClientRect();
			this.world.handleClick(event.pageX - bounds.left, event.pageY - bounds.top);
		});

		this.world.on('interact', cell => {
			console.log(cell);
		});

		this.update();
	}
});