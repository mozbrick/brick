var path = require('path');

module.exports = function(grunt) {

  grunt.initConfig({
    casper: {
      options: {
        test: true
      },
      gecko: {
        options: {
          engine: 'slimerjs'
        },
        src: ['test/*.js']
      }
    },
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
      dist: ['dist/brick.js', 'dist/brick.css'],
      alldist: ['dist/*'],
      site: ['download.html','docs.html','index.html','demos']
    }
  });

  grunt.task.loadTasks('./tasks/');

  // Load all grunt-* and grunt-contrib-* tasks from package.json.
  require('load-grunt-tasks')(grunt);

  grunt.registerTask('default', ['site']);
  grunt.registerTask('bump:patch', ['bumpup:patch', 'tagrelease']);

  grunt.registerTask('fastcompile', ['clean:dist', 'build']);
  grunt.registerTask('fastcompile-dev', ['clean:dist', 'build-dev']);
  grunt.registerTask('site', ['clean:site', 'build', 'demos', 'docs', 'homepage', 'downloadpage']);
  grunt.registerTask('release', ['build', 'zip']);
  grunt.registerTask('test', ['build', 'site', 'casper:gecko']);
  grunt.registerTask('downloadpage', ['dgen', 'gendownloadpage']);

};
