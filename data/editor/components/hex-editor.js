/* column-view */
class HexEditor extends HTMLElement {
  #gutter;
  #hview;
  #bview;
  #editor;
  #scrollbar;
  #config = {
    columns: 4,
    segments: 2,
    rows: 20,
    offset: 0
  };
  #file;

  static hex = array => array.map(byte => byte.toString(16).toUpperCase().padStart(2, '0'));
  static bin = array => array.map(byte => {
    if (byte === 32 || byte === 160) { // space and nbsp
      return '\u00A0';
    }
    if (byte < 33 || byte > 126) {
      return '.';
    }
    return String.fromCharCode(byte);
  });
  static shape = (buffer, options = {}) => {
    const t = options.columns * options.segments || 8;
    const result = [...new Array(t)].map(() => []);

    for (let m = 0; ; m += t) {
      for (let n = 0; n < t; n += 1) {
        if (n + m < buffer.length) {
          result[n].push(buffer[m + n]);
        }
        else {
          return result;
        }
      }
    }
  };
  static rows = (offset, options) => {
    const numbers = [];
    for (let n = 0; n < options.rows; n += 1) {
      const v = offset + n * options.columns * options.segments;
      const c = v.toString(16).padStart(8, '0').toUpperCase();

      numbers.push(c);
    }

    return numbers;
  };

  constructor() {
    super();
    const shadow = this.attachShadow({
      mode: 'open'
    });
    shadow.innerHTML = `
      <style>
        #editor {
          --fg-active: #000;
          --fg-inactive: #999;
          --bd: #ccc;
          --gap: 1ch;
        }

        @layer layout {
          #editor {
            width: fit-content;
            display: flex;
          }
          #body {
            display: grid;
            grid-template-columns: min-content min-content min-content;
            grid-gap: var(--gap);
          }
          #gutter {
            color: var(--fg-inactive);
            height: fit-content;
          }
          #hview {
            padding: 0 var(--gap);
            border-left: solid 1px var(--bd);
            border-right: solid 1px var(--bd);
          }
          #hview,
          #bview {
            --separation: calc(2 * var(--gap));
          }
        }

        @layer scrollbar {
          #editor {
            overflow: auto;
          }
          #body {
            position: sticky;
            top: 0;
          }
        }
      </style>
      <div id="editor">
        <div id=body>
          <column-view id="gutter"></column-view>
          <table-view id="hview"></table-view>
          <table-view id="bview"></table-view>
        </div>
        <div class="scrollbar"></div>
      </div>
    `;

    const gutter = this.#gutter = shadow.querySelector('#gutter');
    const hview = this.#hview = shadow.querySelector('#hview');
    const bview = this.#bview = shadow.querySelector('#bview');
    const editor = this.#editor = shadow.querySelector('#editor');
    this.#scrollbar = shadow.querySelector('.scrollbar');

    // sync
    gutter.addEventListener('change', e => {
      hview.select(gutter.row, 0);
      bview.select(gutter.row, 0);
      this.dispatchEvent(new Event('change'));
    });
    hview.addEventListener('change', () => {
      bview.select(hview.row, hview.column);
      gutter.select(hview.row);
      this.dispatchEvent(new Event('change'));
    });
    bview.addEventListener('change', () => {
      hview.select(bview.row, bview.column);
      gutter.select(bview.row);
      this.dispatchEvent(new Event('change'));
    });

    // scroll
    editor.onscroll = () => {
      const ratio = editor.scrollTop / editor.scrollHeight;
      const config = this.#config;
      const offset = this.#config.offset =
        Math.ceil((this.#file.size * ratio) / (config.columns * config.segments)) *
          config.columns * config.segments;

      this.update(offset);
    };
  }
  configure(options) {
    this.#config.columns = options.columns ?? 4;
    this.#config.segments = options.segments ?? 2;
    this.#config.rows = options.rows ?? 20;
  }
  source(file) {
    this.#file = file;
  }
  async update(offset = this.#config.offset) {
    if (!this.#file) {
      return;
    }

    this.#config.offset = offset;

    const config = this.#config;
    const size = config.columns * config.segments * config.rows;
    const sf = this.#file.slice(offset, offset + size);
    const buffer = await (new Response(sf)).arrayBuffer();
    const array = Array.from(new Uint8Array(buffer));

    const {hex, bin, shape, rows} = HexEditor;
    this.#gutter.build(rows(offset, config));
    this.#hview.build(shape(hex(array), config));
    this.#bview.build(shape(bin(array), config));

    // resize
    const h = Math.max(this.#gutter.offsetHeight, 50);
    this.#editor.style.height = h + 'px';
    this.#scrollbar.style.height = (h * this.#file.size / size) + 'px';
  }
  getClientRects() {
    return [
      ...this.#gutter.getClientRects(),
      ...this.#hview.getClientRects(),
      ...this.#bview.getClientRects()
    ];
  }
  jump(offset) {
    const i = parseInt(offset, 16);

    if (i > this.#file.size) {
      return false;
    }
    const config = this.#config;
    const size = config.columns * config.segments;
    const on = Math.floor(i / size) * size;

    this.update(on);
  }
  inspect(q) {
    return this.shadowRoot.querySelector(q);
  }
}
customElements.define('hex-editor', HexEditor);
