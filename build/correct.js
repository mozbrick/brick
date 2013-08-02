
var fs = require('fs');
var path = require('path');
var promise = require('promisesaplus');
var uglifyjs = require('uglify-js');

loadComponentList().then(minify, err('Unable to read component list.'))
                   .then(writeComponents, err('minification failed.'));

function err(s) {
    return function(err) {
        console.error(s);
        console.error(err.toString());
    }
}

function loadComponentList() {
    var p = promise();
    fs.readFile('build/components.json', function(err, res) {
        if (err) {
            p.reject(err);
        } else {
            p.fulfill(JSON.parse(res));
        }
    });
    return p;
}


function minify(components) {
    console.log('minifying components');
    var p = promise();
    var minifiedCSS = '';
    var minifiedJS = '';

    function processComponent(n) {
        if (n < components.length) {
            minifyComponent(components[n]).then(function(result) {
                minifiedCSS += result.css;
                minifiedJS += result.js;
                processComponent(n+1);
            }, err('Failed to process component ' + components[n] + ': '))
        } else {
            p.fulfill({
                css: minifiedCSS,
                js: minifiedJS
            });
        }
    }

    processComponent(0);
    return p;
}

function minifyComponent(name) {
    var p = promise();
    console.log('  ' + name);

    var js = uglifyjs.minify(path.join(name, 'src', name + '.js'));

    var css = fs.readFileSync(path.join(name, 'src', name + '.css')).toString();

    css = cleancss.process(css);

    p.fulfill({css: css, js: js.code});
    return p;
}

function writeComponents(data) {
    console.log('writing files...');

    fs.writeFileSync('dist/brick.js', data.js);
    fs.writeFileSync('dist/brick.css', data.css);
}


