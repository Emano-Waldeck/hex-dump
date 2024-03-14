// const buffer = new Uint8Array(100);
// crypto.getRandomValues(buffer);

self.columns.value = localStorage.getItem('number-of-columns') || 4;
self.rows.value = localStorage.getItem('number-of-rows') || 30;

const config = {
  columns: Number(self.columns.value),
  segments: 4,
  rows: Number(self.rows.value)
};

const offset = () => {
  const select = this.editor.inspect('#gutter').inspect('select');

  const v = (select.selectedOptions[0] || select.options[0]).textContent;
  self.search.value = v;
};
self.editor.addEventListener('change', offset);

self.run = async file => {
  try {
    document.title = file.name + ' :: Hex Viewer';

    self.search.disabled = false;

    self.container.append(self.editor);

    self.editor.configure(config);
    self.editor.source(file);
    await self.editor.update(0);
    self.editor.classList.remove('hidden');

    offset();
  }
  catch (e) {
    console.error(e);
    alert(e.message);
  }
};

self.columns.onchange = e => {
  config.columns = Number(e.target.value);
  localStorage.setItem('number-of-columns', config.columns);
  self.editor.configure(config);
  self.editor.update();
};
self.rows.onchange = e => {
  config.rows = Number(e.target.value);
  localStorage.setItem('number-of-rows', config.rows);
  self.editor.configure(config);
  self.editor.update();
};

self.search.form.onsubmit = e => {
  e.preventDefault();

  this.editor.jump(self.search.value);
};
self.search.oninvalid = () => self.search.setCustomValidity('Enter hexadecimal offset');
self.search.oninput = () => self.search.setCustomValidity('');
