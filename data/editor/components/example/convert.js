const convert = {};

convert.hex = array => array.map(byte => byte.toString(16).toUpperCase().padStart(2, '0'));
convert.bin = array => array.map(byte => {
  if (byte < 32 || byte > 126) {
    return '.';
  }
  return String.fromCharCode(byte);
});

convert.shape = (buffer, options = {}) => {
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

convert.rows = options => {
  const numbers = [];
  for (let n = 0; n < options.rows; n += 1) {
    const v = n * options.columns * options.segments;
    const c = v.toString(16).padStart(8, '0');

    numbers.push(c);
  }

  return numbers;
};
