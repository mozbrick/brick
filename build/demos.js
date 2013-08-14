var fs = require('fs');
var path = require('path');
var site = require('./statictools');
var promise = require('promisesaplus');

var env = site.env;
var avow = site.avow;
var err = site.err;
var getJSON = site.getJSON;

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
                var componentDemoPath = path.join("component", componentName, 
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
    var indexPagePath = path.join(componentDemoPath, "index.html");

    if(!fs.existsSync(templatePath)){
        console.log("skipped " + componentName + "; no template.html found");
        p.fulfill();
        return p;
    }

    try{
        site.staticPage(templatePath, indexPagePath);
        p.fulfill();
    }
    catch(e){
        p.reject(e);
    }

    console.log("wrote " + templatePath + " -> " + indexPagePath);
    return p;
}


getJSON(path.join("build", "components.json"))
    .then(generateDemoPages, err("failed to build demo index"))
