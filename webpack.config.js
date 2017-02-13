const webpack = require('webpack');
const path = require('path');

module.exports = {
	watch: true,
	entry: path.resolve(__dirname, 'src/main.js'),
	output: {
		filename: 'rpg.js',
		path: path.resolve(__dirname, 'dist')
	},
	module: {
		loaders: [
			{
				test: /\.js/,
				loader: 'babel-loader',
				query: {
					presets: ['es2015']
				}
			}
		]
	}
};