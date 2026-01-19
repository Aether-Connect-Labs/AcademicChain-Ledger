const { verifyApiKey } = require('../middleware/auth');
const apiRateLimit = require('../middleware/apiRateLimit');
const associationGuard = require('../middleware/associationGuard');
const { validate } = require('../middleware/validator');

console.log('verifyApiKey type:', typeof verifyApiKey);
console.log('apiRateLimit type:', typeof apiRateLimit);
console.log('associationGuard type:', typeof associationGuard);
console.log('validate type:', typeof validate);

console.log('verifyApiKey is function?', typeof verifyApiKey === 'function');
console.log('apiRateLimit is function?', typeof apiRateLimit === 'function');
console.log('associationGuard is function?', typeof associationGuard === 'function');
console.log('validate is function?', typeof validate === 'function');
