var bower = require('gulp-bower-files');
var connect = require('gulp-connect');
var distfile = require('./tasks/distfile');
var gulp = require('gulp');
var helptext = require('gulp-helptext');
var imports = require('./tasks/imports');
var rename = require('gulp-rename');
var through = require('through');
var rm = require('gulp-rm');
var uglify = require('gulp-uglify');
var vulcanize = require('gulp-vulcanize');

gulp.task('imports', ['clean'], function () {
  return bower({
    paths: {
      bowerDirectory: 'bower_components'
    }
  }).pipe(imports())
    .pipe(gulp.dest('dist'));
});

gulp.task('dist', ['clean', 'imports'], function () {
  return bower({
    paths: {
      bowerDirectory: 'bower_components'
    }
  }).pipe(gulp.dest('dist'))
    .pipe(distfile())
    .pipe(gulp.dest('dist'));
});

gulp.task('minify.main', ['dist'], function () {
  return gulp.src('dist/brick.html')
    .pipe(rename(function (path) {
      path.basename += '.min';
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('minify.vulcanize', ['minify.main'], function () {
  return gulp.src('dist/brick.min.html')
    .pipe(vulcanize({
      dest: 'dist',
      csp: true,
      inline: true,
      excludes: {
        styles: ['font-awesome.css']
      }
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('minify', ['minify.vulcanize']);

gulp.task('clean', function () {
  return gulp.src('dist/**/*')
    .pipe(rm());
});

gulp.task('build', ['clean', 'imports', 'dist', 'minify']);

gulp.task('help', helptext({
  'help': 'This message'
}));

gulp.task('connect', function() {
  connect.server({
    port: 3001
  });
});

gulp.task('default', ['help']);
