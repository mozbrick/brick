var cheerio = require('cheerio');
var es = require('event-stream');
var fs = require('fs');
var path = require('path');
var Promise = require('es6-promise').Promise;
var transform = require('stream').Transform;
var util = require('gulp-util');

module.exports = function () {

  var stream = new transform({ objectMode: true });
  stream._transform = function(file, unused, done) {
    var f2 = new util.File({
      cwd: file.cwd,
      base: file.base,
      path: file.path,
      contents: file.contents
    });
    stream.push(f2);

    if (path.extname(file.path) === '.html') {
      crawl(file).then(function (files) {
        files.forEach(function (f) {
          stream.push(f);
        });
        done();
      }, done);
    } else {
      done();
    }
  };

  return stream;
};

function getFile(path, base) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path, function (error, contents) {
      if (error) {
        reject(error);
        return;
      }
      resolve(new util.File({
        base: 'bower_components',
        path: path,
        contents: contents
      }));
    });
  });
}

// Returns a list of Vinyl File objects crawled.
function crawl(file, cb) {
  return new Promise(function (resolve, reject) {
    var files = [];
    fs.readFile(file.path, function (error, contents) {
      if (error) {
        console.warn('could not locate file: ', file.path);
        reject();
        return;
      }
      var $ = cheerio.load(contents);
      var scripts = $('script');
      var styles = $('link[rel=stylesheet]');
      var imports = $('link[rel=import]');
      var importPromises = [];
      var baseDir = path.dirname(file.path);
      for (i = 0; i < scripts.length; i++) {
        importPromises.push(getFile(path.join(baseDir, scripts.eq(i).attr('src')),baseDir));
      }
      for (i = 0; i < styles.length; i++) {
        importPromises.push(getFile(path.join(baseDir, styles.eq(i).attr('href')),baseDir));
      }
      for (i = 0; i < imports.length; i++) {
        importPromises.push(crawl(path.join(baseDir, styles.eq(i).attr('href'))));
      }
      resolve(Promise.all(importPromises).then(function (result) {
        return result;
      }));
    });
  });
}