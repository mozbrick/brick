window.addEventListener('WebComponentsReady', function () {

  document.body.style.opacity = 1;
  window.store = document.querySelector('#store');
  window.list = document.querySelector('#list');
  var flip = document.querySelector('x-flipbox');
  var form = document.querySelector('form');

  list.addEventListener('click', function (e) {
    if (e.target.__item__) {
      form.name = e.target.__item__.created;
      flip.flipped = true;
    }
  });

  function closeEdit() {
    flip.flipped = false;
    list.render();
  }

  form.addEventListener('submit', closeEdit);
  document.querySelector('#cancel').addEventListener('click', closeEdit);

  document.querySelector('#new').addEventListener('click', function (e) {
    form.name = Date.now();
    flip.flipped = true;
  });

  store.size().then(function (size) {
    if (size < 5);
    for (var i=0; i < 100; i++) {
      store.insert({
        created: (Date.now()+i).toString(),
        done: false,
        label: (Math.random() * 1e9|0).toString(16)
      }).then(function () {
        console.log('done');
      });
    }
  });
});