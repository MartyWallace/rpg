const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const sass = require('gulp-sass');

gulp.task('js', () => {
	gulp.src(['./src/global.js', './src/lib/**/*.js', './src/game.js'])
		.pipe(concat('main.js'))
		.pipe(babel({ presets: ['es2015'] }))
		.pipe(gulp.dest('./dist'));
});

gulp.task('css', () => {
	gulp.src('./scss/main.scss')
		.pipe(sass())
		.pipe(gulp.dest('./dist'));
});

gulp.task('watch', () => {
	gulp.watch('./src/**/*.js', ['js']);
	gulp.watch('./scss/**/*.scss', ['css']);
});

gulp.task('default', ['js', 'css', 'watch']);