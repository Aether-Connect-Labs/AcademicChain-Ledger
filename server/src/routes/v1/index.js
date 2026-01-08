const router = require('express').Router();

router.use('/verification', require('./verification'));
router.use('/developers', require('./developers'));
router.use('/credentials', require('./credentials'));
router.use('/certify', require('./certify'));

module.exports = router;
