
var cleancss = require('clean-css');
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
    };
}

function loadComponentList() {
    var p = promise();
    fs.readFile(path.join('build','components.json'), function(err, res) {
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
            }, err('Failed to process component ' + components[n] + ': '));
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
    var css;
    var js;
    var distDir = path.join('dist', name);
    console.log(distDir);

    // make dist directory if necessary
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir);
    }

    var jsPath = path.join(distDir, name + '.min.js');
    console.log(jsPath);
    var srcJsPath;
    // special case to account for the x-tag core submodule
    if(name === "core"){
        srcJsPath = path.join('component', 'core', 'src',
                              'x-tag-core', 'dist', 'x-tag-core.js');
    }
    else{
        srcJsPath = path.join('component', name, 'src', name + '.js');
    }

    try {
        js = uglifyjs.minify(srcJsPath);
        fs.writeFileSync(jsPath, js.code);
    } catch (e) {
        p.reject(e);
        return p;
    }

    var cssPath = path.join(distDir, name + '.min.css');
    console.log(cssPath);
    try {
        css = fs.readFileSync(path.join('component', name, 'src', name + '.css')).toString();
        css = cleancss.process(css);
        fs.writeFileSync(cssPath, css);
    } catch (e) {
        p.reject(e);
        return p;
    }

    if (typeof js !== 'undefined' && typeof css !== 'undefined') {
        p.fulfill({css: css, js: js.code});
    } else {
        throw "missing resulting source";
    }
    return p;
}

function writeComponents(data) {
    console.log('writing bundle files...');

    fs.writeFileSync('dist/brick.js', data.js);
    fs.writeFileSync('dist/brick.css', data.css);
    console.log('done!');
}


