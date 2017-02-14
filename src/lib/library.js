export default {
	load() {
		return new Promise((resolve, reject) => {
			PIXI.loader
				.add('/textures/hero1.png')
				.add('/textures/skeleton.png')
				.add('/textures/wall.png')
				.load(() => resolve());
		});
	}
};