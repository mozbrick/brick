var path = require('path');
var site = require('./statictools');

console.log('generating homepage');
site.staticPage(path.join('build','templates','homepage.html'), 'index.html');

