const router = require('express').Router();

router.use('/verification', require('./verification'));
router.use('/developers', require('./developers'));
router.use('/credentials', require('./credentials'));
router.use('/certify', require('./certify'));
router.use('/widgets', require('./widgets'));
router.use('/ai', require('./ai'));
router.use('/creators', require('../creator.routes'));

module.exports = router;
