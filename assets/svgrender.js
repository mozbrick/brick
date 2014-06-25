var Rsvg = require('rsvg').Rsvg;
var fs = require('fs');

// Create SVG render instance.
var svg = new Rsvg();

// When finishing reading SVG, render and save as PNG image.
svg.on('finish', function() {
  console.log('SVG width: ' + svg.width);
  console.log('SVG height: ' + svg.height);
  console.log('f');
  fs.writeFile('logo.png', svg.render({
    format: 'png',
    width: 256,
    height: 256
  }).data);
});

// Stream SVG file into render instance.
fs.createReadStream('logo.svg').pipe(svg);