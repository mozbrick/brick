var path = require('path');

module.exports = function(grunt){


  grunt.registerTask('build', 'Build dist from bower components' , function(){
    var done = this.async();
    grunt.log.write('Fetching files from bower_components...');
    buildGruntConfiguration(grunt, 'bower_components', function(err, configs){
      if (err) grunt.log.write(JSON.stringify(err));
      grunt.log.ok();
      grunt.config.set('stylus', { dist: configs.stylus });
      grunt.config.set('uglify', { dist: configs.uglify });
      grunt.task.run('stylus','uglify');
      done();
    });
  });

  grunt.registerTask('build-dev', 'Build dist from dev repositories' , function(){
    var done = this.async();
    grunt.log.write('Fetching files from dev-repos...');
    buildGruntConfiguration(grunt, 'dev-repos', function(err, configs){
      if (err) grunt.log.write(err);
      grunt.log.ok();
      grunt.config.set('stylus', { dist: configs.stylus });
      grunt.config.set('uglify', { dist: configs.uglify });
      grunt.task.run('stylus','uglify');
      done();
    });
  });

  grunt.registerTask('zip', 'Creates brick-x.x.x.zip', function(){
    var pkg = grunt.file.readJSON('package.json');
    grunt.file.copy('dist/brick.css','dist/zip/brick-'+pkg.version+'.css');
    grunt.file.copy('dist/brick.js','dist/zip/brick-'+pkg.version+'.js');
    grunt.file.copy('build/readme.txt','dist/zip/readme-'+pkg.version+'.txt');
    grunt.file.copy('build/OpenSans-SemiBold.ttf','dist/zip/OpenSans-SemiBold.ttf');
    grunt.config.set('compress',{
      release:{
        options:{
          archive: 'brick-' + pkg.version + '.zip'
        },
        files:[
          {
            expand: true, cwd: 'dist/zip/', src: ['**'], dest: '/'
          }
        ]
      }
    });
    grunt.task.run('compress');
  });

}



function buildGruntConfiguration(grunt, source, callback){

  var stylusConfig = {},
      uglifyConfig = {};

  stylusConfig[path.join('dist','brick.css')] = [];
  uglifyConfig[path.join('dist','brick.js')] = [path.join(source,'x-tag-core','dist','x-tag-core.js')];

  grunt.util.spawn({cmd:'bower', args: ['list','--json']}, function(e, result){
    if (e) grunt.log.write(e);
    var bower_data = JSON.parse(result.stdout);
      dependencies = bower_data.dependencies,
      components = grunt.file.readJSON('./build/components.json');

    var dKeys = Object.keys(dependencies).filter(function(c){
      for (var i = 0; i < components.length; i++){
        if (c.indexOf(components[i])>-1){
          return true;
        }
      };
    });

    dKeys.forEach(function(k){

      var stylusFile = dependencies[k].pkgMeta.main.filter(function(f){
        if(f.indexOf('.styl')>-1){
          return true;
        }
      })[0];

      var jsFile = dependencies[k].pkgMeta.main.filter(function(f){
        if(f.indexOf('.js')>-1){
          return true;
        }
      })[0];

      var dest = path.join('dist', k);

      stylusFile = path.join(source, k, stylusFile);
      stylusConfig[dest + '.min.css'] = stylusFile
      stylusConfig[path.join('dist','brick.css')].push(stylusFile);

      jsFile = path.join(source, k, jsFile);
      uglifyConfig[dest + '.min.js'] = jsFile;
      uglifyConfig[path.join('dist','brick.js')].push(jsFile);

    });

    callback(null, {
      stylus: {
        options: {
          paths: [path.join(source,'brick-common','styles')]
        },
        files: stylusConfig
      },
      uglify: {
        files: uglifyConfig
      }
    });

  });

}