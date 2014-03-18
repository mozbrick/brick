var path = require('path'),
  fs = require('fs'),
  tools = require('../build/statictools');

module.exports = function(grunt){

  grunt.registerTask('build', 'Build dist from bower components' , function(){
    var done = this.async();

    try {
      var sourcePath = ~process.argv.indexOf('--dev') ? 'dev-repos' : 'bower_components';
      grunt.log.writeln('Fetching files from ' + sourcePath);
      buildGruntConfiguration(grunt, sourcePath, function(err, configs){
        if (err) grunt.log.write(JSON.stringify(err));
        execGrunt(grunt, sourcePath, configs, done);
      });
    } catch (e) {
      grunt.log.error('something has gone terribly wrong.');
      grunt.log.error(JSON.stringify(e));
      throw e;
    }
  });

  grunt.registerTask('zip', 'Creates brick-x.x.x.zip', function(){
    var pkg = grunt.file.readJSON('package.json');
    grunt.file.copy('dist/brick.css','dist/zip/brick-'+pkg.version+'.css');
    grunt.file.copy('dist/brick.js','dist/zip/brick-'+pkg.version+'.js');
    grunt.file.copy('dist/brick.min.css','dist/zip/brick-'+pkg.version+'.min.css');
    grunt.file.copy('dist/brick.min.js','dist/zip/brick-'+pkg.version+'.min.js');
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

function execGrunt(grunt, sourcePath, configs, done){
  grunt.log.writeln('Loading Skin:', grunt.option('skin')||'default', ' ');
  loadSkin(grunt, grunt.option('skin'), configs.stylus);
  grunt.config.set('stylus', configs.stylus );
  grunt.config.set('uglify', configs.uglify );
  grunt.task.run('stylus','uglify');
  grunt.file.copy(sourcePath + '/x-tag-core/dist/x-tag-core.min.js','dist/x-tag-core.min.js');
  grunt.file.copy(sourcePath + '/x-tag-core/dist/x-tag-core.js','dist/x-tag-core.js');
  grunt.file.copy('build/readme.txt','dist/readme.txt');
  grunt.file.copy('build/OpenSans-SemiBold.ttf','dist/OpenSans-SemiBold.ttf');
  done();
}

function loadSkin(grunt, skinFolder, config){
  if(!fs.existsSync(path.join('skins',skinFolder||'default'))){
    grunt.log.warn('skin folder ./skins/' + skinFolder + ' is missing, using default.');
  }
  var files = config.dist.files;
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
  uglifyConfig[path.join('dist','brick.js')] = [];

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

    var dependencies = tools.flattenBowerDependencies(bower_data);

    grunt.log.debug('iterating over component dependencies');

    dependencies.forEach(function(item){
      k = Object.keys(item)[0];

      grunt.log.debug('dependency ' + k);

      var stylusFile = item[k].pkgMeta.main.filter(function(f){
        if(f.indexOf('.styl')>-1){
          return true;
        }
      });

      var jsFile = item[k].pkgMeta.main.filter(function(f){
        if(f.indexOf('.js')>-1){
          return true;
        }
      });

      var dest = path.join('dist', k);

      stylusFile.forEach(function(file){
        file = path.join(source, k, file);
        if (stylusConfig[dest + '.css']){
          stylusConfig[dest + '.css'].push(file);
        }
        else {
          stylusConfig[dest + '.css'] = [file];
        }
        stylusConfig[path.join('dist','brick.css')].push(file);
      });

      jsFile.forEach(function(file){
        file = path.join(source, k, file);
        if (uglifyConfig[dest + '.js']){
          uglifyConfig[dest + '.js'].push(file);
        }
        else {
          uglifyConfig[dest + '.js'] = [file];
        }
        uglifyConfig[path.join('dist','brick.js')].push(file);
      });

    });

    var minCSSConfig = {};
    Object.keys(stylusConfig).forEach(function(item){
      minCSSConfig[item.replace('.css','.min.css')] = item;
    });

    var minJSConfig = {};
    Object.keys(uglifyConfig).forEach(function(item){
      minJSConfig[item.replace('.js','.min.js')] = item;
    });

    grunt.log.debug('finishing up');

    callback(null, {
      stylus: {
        dist:{
          options: {
            paths: [path.join(source,'brick-common','styles')],
            compress: false
          },
          files: stylusConfig
        },
        'dist-min': {
          options: {
            compress: true
          },
          files: minCSSConfig
        }
      },
      uglify: {
        dist:{
          options: {
            mangle: false,
            compress: false,
            beautify: true
          },
          files: uglifyConfig
        },
        'dist-min':{
          files: minJSConfig
        }
      }
    });

  });

}
