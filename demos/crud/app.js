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
});