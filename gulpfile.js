const { src, dest, watch, series, parallel } = require('gulp'),
    gulp         = require('gulp'),
    babel        = require('gulp-babel'),
    browserSync  = require('browser-sync').create(),
    sourcemaps   = require('gulp-sourcemaps'),
    rename       = require('gulp-rename'),
    cssmin       = require('gulp-cssnano'),
    sass         = require('gulp-sass'),
    concat       = require('gulp-concat'),
    uglify       = require('gulp-uglify'),
    postcss      = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    replace      = require('gulp-replace');

// File paths
const files = {
  scssPath: 'app/scss/**/*.scss',
  jsPath: 'app/js/**/*.js',
  htmlPath: 'app/*.html',
  imgPath: 'app/img/**/*.*',
};

// Static server
gulp.task('watch', function () {
  browserSync.init({
    server: {
      baseDir: 'public',
    },
  });

  browserSync.watch('app/').on('change', browserSync.reload);
});

//Copying assets
gulp.task('copy', function () {
  return src(['app/images/**/*', 'app/fonts/**/*'], {
    base: 'app',
  }).pipe(gulp.dest('public'));
});

//Copying SRC files
gulp.task('copySrc', function () {
  return src(['app/js/*', 'app/scss/**/*'], {
    base: 'app',
  }).pipe(gulp.dest('public/src'));
});

gulp.task('html', function () {
  return src(['app/*.html'], {
    base: 'app',
  }).pipe(gulp.dest('public'));
});

gulp.task('scssTask', function () {
  return src(files.scssPath)
    .pipe(sass().on('error', sass.logError)) 
    .pipe(postcss([autoprefixer()]))
    .pipe(cssmin())
    .pipe(rename('style.min.css'))
    .pipe(dest('public/css'))
    .pipe(browserSync.stream({stream: true}));
});

// JS task: concatenates and uglifies JS files to script.js
// gulp.task('jsTask', function () {
//   return src([files.jsPath]).pipe(concat('scripts.js')).pipe(dest('public/js'));
// });

gulp.task('jsTask', function () {
  return gulp
    .src(files.jsPath)
    .pipe(concat('scripts.js'))
    .pipe(babel())
    .pipe(uglify())
    .pipe(rename('index.min.js'))
    .pipe(gulp.dest('public/js'));
});

// Cachebust
gulp.task('cachebust', function () {
  var cbString = new Date().getTime();
  return src(['app/module/*.html'])
    .pipe(replace(/cb=\d+/g, 'cb=' + cbString))
    .pipe(dest('public/module'))
    .pipe(browserSync.reload({ stream: true }));
});

// Watch task: watch SCSS and JS files for changes
// If any change, run scss and js tasks simultaneously
gulp.task('watchTask', function () {
  return watch(
    [files.scssPath, files.jsPath, files.htmlPath, files.imgPath],
    { interval: 1000, usePolling: true }, //Makes docker work
    series(parallel('scssTask', 'jsTask', 'cachebust', 'copy', 'html')),
  );
});

// Export the default Gulp task so it can be run
// Runs the scss and js tasks simultaneously
// then runs cacheBust, then watch task
// exports.default = series(parallel(scssTask, jsTask), cacheBustTask, watchTask);
gulp.task(
  'default',
  gulp.parallel('scssTask', 'jsTask', 'watch', 'cachebust', 'copy', 'html', 'watchTask', 'copySrc'),
);
gulp.task('build', gulp.parallel('scssTask', 'jsTask', 'cachebust', 'copy', 'html', 'copySrc'));
