const Utils = {
	Random: {
		/**
		 * A random number between two values.
		 * 
		 * @param {Number} min The minimum value.
		 * @param {Number} max The maximum value.
		 * 
		 * @return {Number}
		 */
		between(min, max) {
			return (min + (Math.random() * Math.abs(max - min)));
		},

		/**
		 * A random item from an array.
		 * 
		 * @param {Array} array The array to choose an item from.
		 * 
		 * @return {any}
		 */
		fromArray(array) {
			if (array.length > 0) {
				return array[Math.floor(Math.random() * array.length)];
			}

			return null;
		}
	}
};