
var fs = require('fs');
var path = require('path');
var nunjucks = require('nunjucks');
var promise = require('promisesaplus');

var env = new nunjucks.Environment(new nunjucks.FileSystemLoader('build/templates'));

function avow(fn) {
    return function() {
        var p = promise();
        var ret;
        try {
            Array.prototype.unshift.apply(arguments, [p.fulfill, p.reject]);
            ret = fn.apply(this, arguments);
        } catch (e) {
            p.reject(e);
        }
        if (typeof ret !== 'undefined') {
            p.fulfill(ret);
        }
        return p;
    };
}

function err(s) {
    return function(err) {
        console.error(s);
        console.error(err.toString());
    }
}

var loadComponentList = avow(function (fulfill, reject) {
    fs.readFile(path.join('build','components.json'), function(err, res) {
        if (err) {
            reject(err);
        }
        fulfill(JSON.parse(res));
    });
});

var generateDocs = avow(function (fulfill, reject, components) {
    console.log('generating documentation');
    var tmpl = env.getTemplate('docs-leaf.html');
    var docs = {};
    function processComponent(n) {
        if (n < components.length) {
            var name = components[n];
            var docPath = path.join('component', name, 'xtag.json');
            var outPath = path.join('docs', name + '.html');
            console.log(name);
            if (fs.existsSync(docPath)) {
                try {
                    var json = JSON.parse(fs.readFileSync(docPath));
                    docs[name] = json;
                } catch (e) {
                    throw 'failed to parse ' + docPath
                }
            }
            processComponent(n+1);
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

loadComponentList()
    .then(generateDocs, err('Unable to read component list.'))
    .then(writeIndex, err('failed to generate documentation.'));

