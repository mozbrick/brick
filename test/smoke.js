mocha.setup('bdd');

var ready;
var expect = chai.expect;

before(function (done) {
  ready = done;
});

window.addEventListener('WebComponentsReady', function() {

  ready();

});

describe("The distribution", function (){

  it("should work at all", function () {
    expect(document.registerElement).to.exist;
  });

  it("should offer Promises", function () {
    expect(window.Promise).to.exist;
  });

  it("should initialize components", function () {
    expect(window.BrickActionElement).to.exist;
    expect(window.BrickAppbarElement).to.exist;
    expect(window.BrickButtonElement).to.exist;
    expect(window.BrickCalendar).to.exist;
    expect(window.BrickCardElement).to.exist;
    expect(window.BrickDeckElement).to.exist;
    expect(window.BrickDialogElement).to.exist;
    expect(window.BrickFlipboxElement).to.exist;
    expect(window.BrickFormElement).to.exist;
    expect(window.BrickInputElement).to.exist;
    expect(window.BrickLayoutElement).to.exist;
    expect(window.BrickListViewElement).to.exist;
    expect(window.BrickMenuElement).to.exist;
    expect(window.BrickStorageIndexeddbElement).to.exist;
    expect(window.BrickTabbarTabElement).to.exist;
    expect(window.BrickTabbarElement).to.exist;
  });

});
