var gulp = require('gulp');
require('gulp-grunt')(gulp);

var paths = {
  site: ['dev-repos/*/demo/template.html', 'build/templates/*'],
  docs: ['dev-repos/*/xtag.json'],
  components: ['dev-repos/**/src/*']
};

gulp.task('site', function() {
  gulp.run('grunt-site');
});

gulp.task('build', function() {
  gulp.run('grunt-build');
});

gulp.task('docs', function() {
  gulp.run('grunt-docs');
});

gulp.task('watch', function() {
  gulp.watch(paths.site, ['site']);
  gulp.watch(paths.docs, ['docs']);
  gulp.watch(paths.components, ['build']);
});
