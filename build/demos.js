var fs = require('fs');
var path = require('path');
var site = require('./statictools');
var promise = require('promisesaplus');
var sourceDir = ~process.argv.indexOf('--dev') ? 'dev-repos' : 'bower_components';

var env = site.env;
var avow = site.avow;
var err = site.err;
var getJSON = site.getJSON;
var getBowerComponents = site.getBowerComponents;

var generateDemoPages = avow(function(fulfill, reject, components){
    console.log("generating demo pages...");

    function processComponent(n){
        if(n < components.length){
            var componentName = components[n];
            if(componentName === "core"){
                // skip producing template for core
                processComponent(n+1);
                return;
            }
            else{
                // TODO: this should use bower list --json
                var componentDemoPath = path.join(sourceDir, componentName,
                                                  "demo");
                processComponentTemplate(componentDemoPath, componentName).then(function(){
                    processComponent(n+1);
                }, err('unable to generate demo page for ' + componentName));
            }
        }
        else{
            fulfill(true);
        }
    }

    processComponent(0);
});


function processComponentTemplate(componentDemoPath, componentName){
    var p = promise();

    var templatePath = path.join(componentDemoPath, "template.html");
    var outputDir = path.join("demos", componentName);
    var outputPath = path.join(outputDir, "index.html");

    if(!fs.existsSync(templatePath)){
        console.log("skipped " + componentName + "; no template.html found");
        p.fulfill();
        return p;
    }

    if(!fs.existsSync("demos")){
        fs.mkdirSync("demos");
    }

    if(!fs.existsSync(outputDir)){
        fs.mkdirSync(outputDir);
    }

    try{
        site.staticPage(templatePath, outputPath);
    }
    catch(e){
        p.reject(e);
    }

    console.log("wrote " + templatePath + " -> " + outputPath);

    // copy over demo files
    var demoFiles = ["demo.css", "demo.js"];
    demoFiles.forEach(function(demoFilename){
        var srcPath = path.join(componentDemoPath, demoFilename);
        if(!fs.existsSync(srcPath)) return;

        var src = fs.readFileSync(srcPath);
        var outPath = path.join(outputDir, demoFilename);
        fs.writeFileSync(outPath, src);
        console.log("  - copied " + srcPath + " -> " + outPath);
    });

    p.fulfill();

    return p;
}


getJSON(path.join("build", "components.json"))
    .then(getBowerComponents, err("failed to find bower components"))
    .then(generateDemoPages, err("failed to build demo index"))
