var path = require('path'),
  tools = require('../build/statictools');

module.exports = function(grunt){

  grunt.registerTask('clone-repos',
    'Pulls in git repos for all components to ease the development process',
    function(){
      var done = this.async(),
        async = grunt.util.async;

      grunt.log.write('bower install... ');
      grunt.util.spawn({cmd:'bower', args: ['install']}, function(e, result){
        grunt.log.write().ok();
        grunt.log.write('Fetching repo details from bower components... ');
        grunt.util.spawn({cmd:'bower', args: ['list','--json']}, function(e, result){
          grunt.log.write('Parsing details ');

          var bower_data = JSON.parse(result.stdout),
            gitCloneOptions = {},
            dependencies = tools.flattenBowerDependencies(bower_data);

          grunt.log.write().ok();

          async.forEachSeries(dependencies, function(item, cb){
            var key = Object.keys(item)[0];
            var args = [
              'clone',
              item[key].pkgMeta._source.replace('git://','https://') ,
              path.join('dev-repos', item[key].endpoint.name) ];

            try {
              grunt.log.write('Processing '+item[key].endpoint.name+ '\n ');
              grunt.util.spawn({cmd:'git', args: args}, function(e,result){
                if (e){
                  grunt.log.write(e).warn();
                }
                else {
                  grunt.log.write(result.stdout).ok();
                }
                cb();
              });
            }
            catch(e) {
              grunt.log.write(e).warn();
              cb();
            }
          }, function(e){
            grunt.log.write('Completed ').ok();
            done();
          });
        });
      });
  });
}
