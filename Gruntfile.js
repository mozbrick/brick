var path = require('path');

module.exports = function(grunt) {

  grunt.initConfig({
    connect: {
      demo: {
        options:{
          port: 3001,
          base: '',
          keepalive: true
        }
      }
    },
    pkg: grunt.file.readJSON('package.json'),
    bumpup: ['bower.json', 'package.json'],
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

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-stylus');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-bumpup');
  grunt.loadNpmTasks('grunt-tagrelease');

  grunt.registerTask('default', ['site']);
  grunt.registerTask('bump:patch', ['bumpup:patch', 'tagrelease']);

  grunt.registerTask('fastcompile', ['clean:dist','build']);
  grunt.registerTask('fastcompile-dev', ['clean:dist','build-dev']);
  grunt.registerTask('site', ['clean:site','build','demos','docs','homepage','downloadpage']);
  grunt.registerTask('release', ['build','zip']);

};
