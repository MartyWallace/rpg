class HUD {
	constructor(world) {
		this.world = world;
		this.graphics = new PIXI.Container();
		this.items = [];

		this.world.on('load', this.setup.bind(this));
	}

	clear() {
		this.items.forEach(item => {
			this.graphics.removeChild(item.graphics);
		});

		this.items = [];
	}

	setup() {
		this.clear();

		this.world.party.heroes.forEach((hero, index) => {
			let status = new HeroStatus(hero);

			status.graphics.y = renderer.height - 100;
			status.graphics.x = index * 70 + 20;

			this.items.push(status);
			this.graphics.addChild(status.graphics);
		});
	}

	update() {
		this.items.forEach(item => item.update());
	}
}

class HeroStatus {
	constructor(hero) {
		this.hero = hero;
		this.graphics = new PIXI.Container();

		let back = new PIXI.Graphics();
		back.beginFill(0x000000);
		back.drawRect(0, 0, 60, 80);
		back.endFill();

		this.hpbar = new PIXI.Graphics();
		this.hpbar.beginFill(0x00CC22);
		this.hpbar.drawRect(0, 0, 56, 8);
		this.hpbar.endFill();

		this.hpbar.position.set(2, 70);

		this.graphics.addChild(back);
		this.graphics.addChild(this.hpbar);
	}

	update() {
		//
	}
}