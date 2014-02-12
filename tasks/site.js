module.exports = function(grunt){
  grunt.registerTask('demos', 'Rebuild demos', function(){
    var done = this.async();
    grunt.util.spawn({cmd:'node', args: ['./build/demos.js', ~process.argv.indexOf('--dev') ? '--dev': '']}, function(e, result){
      console.log(result.stdout);
      done();
    });
  });
  grunt.registerTask('docs', 'Rebuild docs', function(){
    var done = this.async();
    grunt.util.spawn({cmd:'node', args: ['./build/docs.js', ~process.argv.indexOf('--dev') ? '--dev': '']}, function(e, result){
      console.log(result.stdout);
      done();
    });
  });
  grunt.registerTask('homepage', 'Rebuild homepage', function(){
    var done = this.async();
    grunt.util.spawn({cmd:'node', args: ['./build/homepage.js', ~process.argv.indexOf('--dev') ? '--dev': '']}, function(e, result){
      console.log(result.stdout);
      done();
    });
  });
  grunt.registerTask('downloadpage', 'Rebuild download page', function(){
    var done = this.async();
    grunt.util.spawn({cmd:'node', args: ['./build/download.js', ~process.argv.indexOf('--dev') ? '--dev': '']}, function(e, result){
      console.log(result.stdout);
      done();
    });
  });

}
