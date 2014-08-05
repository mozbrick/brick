mocha.setup('bdd');

var ready;

before(function (done) {
  ready = done;
});

var expect = chai.expect;

window.addEventListener('WebComponentsReady', function() {

  // document.head.innerHTML += '<link rel="import" id="el" href="/base/src/brick-storage-indexeddb.html">';

  ready();

});

describe("the key value store with key", function(){

  // before(function(done){
  //   sampleItems = generateSampleItems(n);
  //   singleItem = generateSampleItems(1)[0];
  //   populateDb(kvk)
  //     .then(function(){
  //       done();
  //     });
  // });

  it("should work at all", function(){
    expect(document.registerElement).to.be.truthy;
  });

});
