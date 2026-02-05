
try {
    console.log('Attempting to load app...');
    const { app } = require('../server/src/app');
    console.log('App loaded successfully');
} catch (e) {
    console.error('Failed to load app:', e);
}
