try {
  const mod = require('path-to-regexp');
  const resolved = require.resolve('path-to-regexp');
  if (mod && typeof mod !== 'function' && typeof mod.pathToRegexp === 'function') {
    const fn = function(path, keys, options) { return mod.pathToRegexp(path, keys, options); };
    require.cache[resolved].exports = fn;
  }
} catch {}
