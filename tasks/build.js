var path = require('path'),
  fs = require('fs');

module.exports = function(grunt){


  grunt.registerTask('build', 'Build dist from bower components' , function(){
    var done = this.async();
    grunt.log.writeln('Fetching files from bower_components...');
    try {
      buildGruntConfiguration(grunt, 'bower_components', function(err, configs){
        if (err) grunt.log.write(JSON.stringify(err));
        grunt.log.writeln('Loading Skin:', grunt.option('skin')||'default', ' ');
        loadSkin(grunt, grunt.option('skin'), configs.stylus);
        grunt.config.set('stylus', { dist: configs.stylus });
        grunt.config.set('uglify', { dist: configs.uglify });
        grunt.task.run('stylus','uglify');
        done();
      });
    } catch (e) {
      grunt.log.error('something has gone terribly wrong.');
      grunt.log.error(JSON.stringify(e));
      throw e;
    }
  });

  grunt.registerTask('build-dev', 'Build dist from dev repositories' , function(){
    var done = this.async();
    grunt.log.writeln('Fetching files from dev-repos...');
    buildGruntConfiguration(grunt, 'dev-repos', function(err, configs){
      if (err) grunt.log.write(err);
      grunt.log.writeln('Loading Skin:', grunt.option('skin')||'default', ' ');
      loadSkin(grunt, grunt.option('skin'), configs.stylus);
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

function loadSkin(grunt, skinFolder, config){
  if(!fs.existsSync(path.join('skins',skinFolder||'default'))){
    grunt.log.warn('skin folder ./skins/' + skinFolder + ' is missing, using default.');
  }
  var files = config.files;
  var keys = Object.keys(files);
  keys.forEach(function(k){
    var val = files[k];
    if (typeof val == 'string'){
      var skinFile = getSkinFile(grunt, skinFolder, val);
      if (skinFile){
        files[k] = [val, skinFile];
      }
    } else {
      newList = val.slice(0);
      val.forEach(function(scaffold, idx){
        var skinFile = getSkinFile(grunt, skinFolder, scaffold);
        if (skinFile){
          newList.push(skinFile);
        }
      });
      files[k] = newList;
    }
  });
}

function getSkinFile(grunt, skinFolder, component){
  component = component.split(path.sep)[1];
  var componentSkin = path.join('skins', skinFolder||'default',component+'.styl');
  if (fs.existsSync(componentSkin)){
    return componentSkin;
  } else if(skinFolder){  //fallback to default, if there is a default
    componentSkin = path.join('skins', 'default', component+'.styl');
    if (fs.existsSync(componentSkin)){
      grunt.log.writeln('>> Unable to find skin ' + path.join(skinFolder, component) + ', using default');
      return componentSkin;
    }
  }
}

function buildGruntConfiguration(grunt, source, callback){
  var componentLocation = path.join(source,'brick-common');
  if (!fs.existsSync(componentLocation)){
    if (source == 'dev-repos') {
      grunt.fail.warn('Source files missing, did you run "grunt clone-repos" yet?\n');
    } else {
      grunt.fail.warn('Source files missing, did you run "bower install" yet?\n');
    }
    return;
  }

  grunt.log.debug('building grunt configuration...');

  var stylusConfig = {},
      uglifyConfig = {};

  stylusConfig[path.join('dist','brick.css')] = [];
  uglifyConfig[path.join('dist','brick.js')] = [path.join(source,'x-tag-core','dist','x-tag-core.js')];

  grunt.log.debug('spawning bower tasks');

  grunt.util.spawn({cmd:'bower', args: ['-j', 'list']}, function(e, result){
    if (e) grunt.log.write(e);
    grunt.log.debug('parsing bower data');
    var bower_data;
    try {
      bower_data = JSON.parse(result.stdout);
    } catch (e) {
      grunt.log.error('cannot parse bower output. giving up.');
      grunt.log.debug('bower said:');
      grunt.log.debug(result.stdout);
      throw e;
    }
    var dependencies = bower_data.dependencies;
    var componentsJson = grunt.file.readJSON('./build/components.json');
    var components = [];
    Object.keys(componentsJson).forEach(function(key){
      components.push(componentsJson[key]);
    });

    var dKeys = Object.keys(dependencies).filter(function(c){
      for (var i = 0; i < components.length; i++){
        if (c.indexOf(components[i])>-1){
          return true;
        }
      };
    });

    grunt.log.debug('iterating over component deps');

    dKeys.forEach(function(k){

      grunt.log.debug('dependency ' + k);

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

    grunt.log.debug('finishing up');

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