
casper.test.begin('Brick homepage loads and has no JS errors.', 4, function suite(test) {

    var fs = require('fs');

    rootPath = fs.workingDirectory;

    casper.start(rootPath + "/index.html", function() {
        test.assertTitle("Brick", "brick homepage title is as expected");
        test.assertExists('x-flipbox', "x-flipbox demo is present");
        casper.viewport(320,480);
    });

    casper.then(function() {
        this.click('.controls .btn');
        this.wait(1000);
    });

    casper.then(function() {
        test.assertExists('x-flipbox[flipped]', 'x-flipbox flips properly');
        this.click('.controls .btn');
        this.wait(1000);
    });

    casper.then(function() {
        test.assertExists('x-flipbox:not([flipped])', 'x-flipbox flips back properly');
    });

    casper.run(function() {
        test.done();
    });
});