document.addEventListener('DOMComponentsLoaded', function(){
    // demonstrate dynamic tab-target handling in slidebox demo
    var slideBox = document.querySelector('x-slidebox');
    var slideBoxTabbar = document.getElementById("slide-box-tabbar");

    // assign each tab to its respective slide in the slidebox
    var tabs = slideBoxTabbar.tabs;
    var slides = xtag.query(slideBox, 'x-slide');
    for(var i=0; i < slides.length && i < tabs.length; i++){
        var tab = tabs[i];
        var slide = slides[i];

        tab.targetElems = [slide];
    }
});

document.addEventListener('DOMComponentsLoaded', function(){
    // handle custom events demo
    document.querySelector("#color-box > span").addEventListener("danceparty", function(e){
        alert("The text received danceparty!");
    });

    document.querySelector("#color-box > img").addEventListener("danceparty", function(e){
        alert("The image received danceparty!");
    });

    document.querySelector("#color-box > img").addEventListener("override", function(e){
        alert("The image received override!");
    });
});

document.addEventListener('DOMComponentsLoaded', function(){
    DemoHelpers.initializeDemos();
});