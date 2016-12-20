const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');

gulp.task('js', () => {
	let pipe = gulp.src('./src/**/*.js')
		.pipe(babel({ presets: ['es2015'] }))
		.pipe(concat('main.js'));
	
	pipe.pipe(gulp.dest('./dist'));
});

gulp.task('watch', () => gulp.watch('./src/**/*.js', ['js']));
gulp.task('default', ['js', 'watch']);