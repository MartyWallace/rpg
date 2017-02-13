export default {
	tween(target) {
		return createjs.Tween.get(target);
	},

	ease(style) {
		if (style in createjs.Ease) {
			return createjs.Ease[style];
		} else {
			throw new Error('Ease style "' + style + '" does not exist.');
		}
	}
};