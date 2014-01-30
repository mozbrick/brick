
var fs = require('fs');
var path = require('path');
var site = require('./statictools');
var promise = require('promisesaplus');

var env = site.env;
var avow = site.avow;
var err = site.err;
var getJSON = site.getJSON;
var getBowerComponents = site.getBowerComponents;

var generateDocs = avow(function (fulfill, reject, componentsJson) {
    console.log('generating documentation');

    var components = [];
    Object.keys(componentsJson).forEach(function(key){
      components.push(componentsJson[key]);
    });

    var data = {docs:{}, pkgJson: {}};
    function processComponent(n) {
        if (n < components.length) {
            var name = components[n];
            var docPath = path.join('bower_components', name, 'xtag.json');
            var pkgPath = path.join('bower_components', name, 'package.json');
            console.log(name, docPath);
            if (name === 'core') {
                processComponent(n+1);
                return;
            }
            if (fs.existsSync(docPath)) {
                getJSON(docPath).then(function(json) {
                    data.docs[name] = json;
                    if(fs.existsSync(pkgPath)){
                        getJSON(docPath).then(function(json) {
                            data.pkgJson[name] = json;
                            processComponent(n+1);
                        });
                    }
                }, err('failed to parse ' + docPath));
            } else {
                console.warn('no xtag.json found for ' + name + '!');
                data[name] = {};
                processComponent(n+1);
            }
        } else {
            fulfill(data);
        }
    }
    processComponent(0);
});

var writeIndex = avow(function (fulfill, reject, data) {
    console.log('writing index');
    site.staticPage('docs.html', 'docs.html', {tags: data.docs, pkgJson: data.pkgJson });
    console.log('index written!');
    return true;
});

getJSON(path.join('build','components.json'))
    .then(getBowerComponents)
    .then(generateDocs, err('Unable to read component list.'))
    .then(writeIndex, err('failed to generate documentation.')).then(false, err('failed to write index'));

