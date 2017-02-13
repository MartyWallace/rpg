export default {
	/**
	 * Clamp a number between two values.
	 * 
	 * @param {Number} value The value to clamp.
	 * @param {Number} min The minimum value.
	 * @param {Number} max The maximum value.
	 * 
	 * @return {Number}
	 */
	clamp(value, min, max) {
		return Math.min(Math.max(value, min), max);
	}
};