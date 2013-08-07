
var fs = require('fs');
var path = require('path');
var site = require('./statictools');
var promise = require('promisesaplus');

var env = site.env;
var avow = site.avow;
var err = site.err;
var getJSON = site.getJSON;

var generateDocs = avow(function (fulfill, reject, components) {
    console.log('generating documentation');
    var docs = {};
    function processComponent(n) {
        if (n < components.length) {
            var name = components[n];
            var docPath = path.join('component', name, 'xtag.json');
            var outPath = path.join('docs', name + '.html');
            console.log(name);
            if (name === 'core') {
                processComponent(n+1);
                return;
            }
            if (fs.existsSync(docPath)) {
                getJSON(docPath).then(function(json) {
                    docs[name] = json;
                    processComponent(n+1);
                }, err('failed to parse ' + docPath));
            } else {
                console.warn('no docs found for ' + name + '!');
                docs[name] = {};
                processComponent(n+1);
            }
        } else {
            fulfill(docs);
        }
    }
    processComponent(0);
});

var writeIndex = avow(function (fulfill, reject, docs) {
    console.log('writing index');
    var tmpl = env.getTemplate('docs.html');
    fs.writeFileSync('docs.html', tmpl.render({tags: docs}));
    return true;
});

getJSON(path.join('build','components.json'))
    .then(generateDocs, err('Unable to read component list.'))
    .then(writeIndex, err('failed to generate documentation.')).then(false, err('failed to write index'));

