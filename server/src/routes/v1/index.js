const router = require('express').Router();

router.use('/verification', require('./verification'));
router.use('/developers', require('./developers'));
router.use('/credentials', require('./credentials'));

module.exports = router;