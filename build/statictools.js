
var fs = require('fs');
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
    return function (err) {
        console.error(s);
        console.error(err.toString());
    }
}

var staticPage = function(tmpl, path) {
  var t = env.getTemplate(tmpl);
  fs.writeFileSync(path, t.render());
}

var getJSON = avow(function (fulfill, reject, path) {
  fs.readFile(path, function(err, res) {
    if (err) {
        reject(err);
    }
    fulfill(JSON.parse(res));
  });
});

module.exports = {
  avow: avow,
  err: err,
  env: env,
  staticPage: staticPage,
  getJSON: getJSON
};