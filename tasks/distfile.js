var cheerio = require('cheerio');
var reduce = require("stream-reduce");
var through = require('event-stream').through;
var path = require('path');
var util = require('gulp-util');

module.exports = function () {

  var files = [];
  var stream = through(function write(data) {
    console.log(data.path);
    files.push(data);
  },
  function end () {
    var $ = cheerio.load('<!doctype html>\n<html><head>\n  <meta charset=utf-8></head></html>');
    var head = $('head');
    files.forEach(function (file) {
      if (path.basename(file.path) === 'platform.js') {
        return;
      }
      var ext = path.extname(file.path);
      var fp = path.relative(file.base, file.path);
      switch (ext) {
        case '.css':
          head.append('\n  <link rel="stylesheet" href="' + fp + '">');
          break;
        case '.js':
          head.append('\n  <script src="' + fp + '"></script>');
          break;
        case '.html':
          head.append('\n  <link rel="import" href="' + fp + '">');
          break;
      }
    });
    head.append('\n');
    this.push(new util.File({
      path: 'brick.html',
      base: '',
      contents: new Buffer($.html())
    }));
    this.emit('end');
  });

  return stream;
};
