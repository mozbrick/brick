var bower = require('gulp-bower-files');
var connect = require('gulp-connect');
var distfile = require('./gulp/distfile');
var gulp = require('gulp');
var helptext = require('gulp-helptext');
var imports = require('./gulp/imports');
var rm = require('gulp-rm');

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

gulp.task('clean', function () {
  return gulp.src('dist/**/*')
    .pipe(rm());
});

gulp.task('build', ['clean', 'imports', 'dist']);

gulp.task('help', helptext({
  'help': 'This message'
}));

gulp.task('connect', function() {
  connect.server({
    port: 3001
  });
});

gulp.task('default', ['help']);
