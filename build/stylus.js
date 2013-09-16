var fs = require('fs');
var path = require('path');
var promise = require('promisesaplus');

function err(s) {
    return function(err) {
        console.error(s);
        console.error(err.toString());
    }
}

loadComponentList().then(findStylusComponents, err('Unable to read component list.'))
                   .then(done, err('minification failed.'));

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

function findStylusComponents(components) {
    var p = promise();
    stylusComponents = [];
    components.forEach(function (c) {
        var stylusFile = path.join('component', c, 'src', c + '.styl');
        if (fs.existsSync(stylusFile)) {
            stylusComponents.push(stylusFile);
        }
    });
    p.fulfill(stylusComponents);
    return p;
}

function done(files) {
    console.log(files.join('\n'));
}