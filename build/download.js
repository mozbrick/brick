
var path = require('path');
var site = require('./statictools');

var avow = site.avow;
var getJSON = site.getJSON;
var each = site.each;
var err = site.err;

var buildDependencyTree = avow(function (fulfill, reject, list) {
  console.log('building dependency tree');
  var tree = {};
  each(list, function(fulfill, reject, c) {
    console.log(c);
    if (c === 'core') {
      fulfill();
      return;
    }
    var docPath = path.join('component',c,'xtag.json');
    getJSON(docPath).then(function(json) {
      tree[c] = json.dependencies || [];
      fulfill()
    }, err('could not load ' + docPath));
  }).then(function() {
    fulfill(tree)
  }, reject);
});

var renderDownloadPage = avow(function (fulfill, reject, tree) {
  site.staticPage('site/download.html', 'download.html', { dependencies: tree });
  console.log('wrote download.html');
});

console.log('generating download page');

getJSON('build/components.json')
  .then(buildDependencyTree, err('could not fetch component list'))
  .then(renderDownloadPage, err('could not get dependencies'))
  .then(false, err('problem'));

