
const mongoose = require('mongoose');

const localUri = 'mongodb://127.0.0.1:27017/academicchain';

mongoose.connect(localUri)
  .then(() => {
    console.log('Successfully connected to local MongoDB');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to connect to local MongoDB:', err.message);
    process.exit(1);
  });
