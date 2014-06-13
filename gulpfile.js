var gulp = require('gulp');
var bower = require('gulp-bower-files');
var connect = require('gulp-connect');
var es = require('event-stream');
var helptext = require('gulp-helptext');
var imports = require('./gulp/imports');

gulp.task('build', function () {
  return bower({
    paths: {
      bowerDirectory: 'bower_components'
    }
  }).pipe(imports())
    .pipe(gulp.dest('dist'));
});

gulp.task('help', helptext({
  'help': 'This message'
}));

gulp.task('connect', function() {
  connect.server({
    port: 3001
  });
});

gulp.task('default', ['help']);
