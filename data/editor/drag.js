// File drag handling
document.addEventListener('dragover', e => {
  e.preventDefault();
  document.body.classList.add('dragging');
});

document.addEventListener('dragleave', e => {
  e.preventDefault();
  document.body.classList.remove('dragging');
});
document.addEventListener('drop', e => {
  event.preventDefault();
  document.body.classList.remove('dragging');

  const [file] = event.dataTransfer.files;
  self.run(file);
});

// Double click handling
self.container.addEventListener('dblclick', function() {
  const file = document.createElement('input');
  file.type = 'file';
  file.style.display = 'none';
  document.body.appendChild(file);

  file.addEventListener('change', function() {
    const [f] = file.files;
    self.run(f);
    document.body.removeChild(file);
  });

  file.click();
});
