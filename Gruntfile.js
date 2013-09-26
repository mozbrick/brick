var path = require('path');

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bumpup: ['bower.json', 'package.json', 'xtag.json'],
    tagrelease: {
      file: 'package.json',
      prefix: '',
      commit: true
    },
    clean: {
      dist: ['dist/brick.js','dist/brick.css'],
      alldist: ['dist/*'],
      site: ['download.html','docs.html','index.html','demos']
    }
  });

  grunt.task.loadTasks('./tasks/');

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-bumpup');
  grunt.loadNpmTasks('grunt-tagrelease');

  grunt.registerTask('default', ['build']);
  grunt.registerTask('bump:patch', ['bumpup:patch', 'tagrelease']);

  grunt.registerTask('fastcompile', ['clean:dist','build']);
  grunt.registerTask('fastcompile-dev', ['clean:dist','build-dev']);
  grunt.registerTask('site', ['clean:site','demos','docs','homepage','downloadpage','build']);
  grunt.registerTask('release', ['build','zip']);

};
