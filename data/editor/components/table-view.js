/* column-view */
class ColumnView extends HTMLElement {
  #select;
  #editor;

  constructor() {
    super();
    const shadow = this.attachShadow({
      mode: 'open'
    });
    shadow.innerHTML = `
      <style>
        :host {
          width: fit-content;
        }
        #body {
          width: fit-content;
          position: relative;
          overflow: hidden;
          background-color: inherit;
          color: inherit;
          font-size: inherit;
        }
        select {
          overflow: hidden;
          border: none;
          outline: none;
          font-family: monospace;
          font-size: inherit;
          color: inherit;
          background-color: inherit;
        }
        option:checked {
          background: var(--active-bg, transparent);
        }
        select:focus option:checked {
          box-shadow: 0 0 0 1px red inset;
          background: var(--active-bg, transparent) linear-gradient(0deg, var(--active-bg, transparent) 0%,
            var(--active-bg, transparent) 500%);
        }
      </style>
      <div id="body">
        <select id="select" size="2">
          <option>0</option>
          <option>0</option>
        </select>
      </div>
    `;

    this.#select = shadow.querySelector('#select');

    // chaining (move with Arrow keys or Tab)
    this.#select.onkeydown = e => {
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.key === 'Tab') {
        const direction = (e.code === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) ? -1 : +1;

        const event = new CustomEvent('Navigate', {
          bubbles: true,
          detail: {
            direction,
            n: this.#select.selectedIndex
          }
        });
        this.dispatchEvent(event);
        return !event.detail.blocked;
      }
      return true;
    };
    // change event
    this.#select.onchange = e => {
      this.dispatchEvent(new Event('change', {
        bubbles: true
      }));
    };
    // select an element on focus event
    this.#select.onfocus = e => requestAnimationFrame(() => {
      if (this.#select.value === '') {
        this.select(0);
        this.dispatchEvent(new Event('change', {
          bubbles: true
        }));
      }
      this.dispatchEvent(new Event('focus', {
        bubbles: true
      }));
    });
  }

  build(lines) {
    if (this.#select.size === lines.length) {
      lines.forEach((hex, n) => {
        // if (hex === ' ') {
        //   this.#select.options[n].innerHTML = '&nbsp;';
        // }
        // else {
        // }
        this.#select.options[n].textContent = hex;
      });
    }
    else {
      this.#select.textContent = '';
      lines.forEach(hex => {
        const option = document.createElement('option');
        option.textContent = hex;
        this.#select.append(option);
      });
      this.#select.size = lines.length;
    }
    this.#select.value = '';
  }
  select(n) {
    this.#select.selectedIndex = n;
  }
  focus() {
    this.#select.focus();
  }
  get row() {
    return this.#select.selectedIndex;
  }
  inspect(q) {
    return this.shadowRoot.querySelector(q);
  }
}
customElements.define('column-view', ColumnView);

/* table-view */
class TableView extends HTMLElement {
  #body;
  #column = -1;
  #row = -1;
  #change(e) {
    if (e.target.column !== this.#column || e.target.row !== this.#row) {
      this.#activate(e.target);
      this.dispatchEvent(new Event('change', {
        bubbles: true
      }));
    }
  }
  #activate(c) {
    this.#row = c.row;
    if (this.#column !== c.column) {
      this.#column = c.column;
      [...this.#body.querySelectorAll('column-view.active')].forEach(c => c.classList.remove('active'));
      c.classList.add('active');
    }
  }
  constructor() {
    super();
    const shadow = this.attachShadow({
      mode: 'open'
    });
    shadow.innerHTML = `
      <style>
        #body {
          display: flex;
        }
        column-view:nth-child(4n):not(:last-child) {
          margin-right: var(--separation, 2ch);
        }
        column-view.active {
          --active-bg: var(--select-bg, #8fdcff);
        }
      </style>
      <div id="body">
        <column-view></column-view>
      </div>
    `;
    this.#body = shadow.querySelector('#body');

    shadow.addEventListener('focus', e => {
      this.#change(e);
    });
    shadow.addEventListener('change', e => {
      this.#change(e);
    });
    // navigation
    shadow.addEventListener('Navigate', e => {
      const p = e.target[e.detail.direction > 0 ? 'nextElementSibling' : 'previousElementSibling'];
      if (p && p.select) {
        e.detail.blocked = true;
        p.select(e.detail.n);
        p.focus();
        p.dispatchEvent(new Event('change', {
          bubbles: true
        }));
      }
      else {
        e.detail.blocked = false;
      }
    });
  }
  build(array) { // [[], [], []]
    this.#column = -1;
    this.#row = -1;

    const cvs = this.#body.querySelectorAll('column-view');
    if (array.length === cvs.length) {
      for (let n = 0; n < array.length; n += 1) {
        cvs[n].build(array[n]);
      }
    }
    else {
      this.#body.textContent = '';
      for (let n = 0; n < array.length; n += 1) {
        const c = document.createElement('column-view');
        c.column = n;
        this.#body.append(c);
        c.build(array[n]);
      }
    }
  }
  select(row, column) {
    if (isNaN(column)) {
      return;
    }
    const c = this.#body.querySelector(`column-view:nth-child(${column + 1})`);
    if (c) {
      c.select(row);
      this.#activate(c);
    }
  }
  get column() {
    return this.#column;
  }
  get row() {
    const c = this.#body.querySelector(`column-view:nth-child(${this.#column + 1})`);
    if (c) {
      return c.row;
    }
    return -1;
  }
  inspect(q) {
    return this.shadowRoot.querySelector(q);
  }
}
customElements.define('table-view', TableView);
