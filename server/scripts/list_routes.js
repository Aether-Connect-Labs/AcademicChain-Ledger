const { app } = require('../src/app');

function printRoutes(stack, prefix = '') {
  stack.forEach(layer => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
      console.log(`${methods} ${prefix}${layer.route.path}`);
    } else if (layer.name === 'router' && layer.handle.stack) {
      // It's a middleware (router)
      // The path for this router is hidden in the regex usually, but for express.Router() mounted via app.use('/path', router),
      // layer.regexp shows the path.
      // We can try to guess it or just recurse.
      // In Express 4, app.use('/api', router) creates a layer with regexp matching /api
      
      // Attempt to extract path from regexp (fragile but often works for simple paths)
      const regexpStr = layer.regexp.toString();
      let routePath = '';
      if (regexpStr.includes('/api/partner')) routePath = '/api/partner'; // hardcoded check for debugging
      else if (regexpStr.includes('/api/admin')) routePath = '/api/admin';
      
      // For now, let's just inspect specifically partner routes
      // console.log(`Router Layer: ${regexpStr}`);
      printRoutes(layer.handle.stack, prefix + (routePath || ''));
    }
  });
}

console.log('--- Registered Routes ---');
// app._router is where the middleware stack lives
if (app._router && app._router.stack) {
  app._router.stack.forEach(r => {
    if (r.route && r.route.path) {
        console.log(r.route.path)
    } else if (r.name === 'router') {
        // console.log('Router', r.regexp)
        if (r.regexp.toString().includes('partner')) {
            console.log('Found Partner Router');
            r.handle.stack.forEach(sub => {
                if (sub.route) {
                    console.log(`PARTNER ROUTE: ${Object.keys(sub.route.methods).join(',').toUpperCase()} ${sub.route.path}`);
                }
            })
        }
    }
  })
}
