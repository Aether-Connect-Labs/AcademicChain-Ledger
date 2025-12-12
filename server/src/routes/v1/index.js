const router = require('express').Router();

router.use('/verification', require('./verification'));
router.use('/developers', require('./developers'));
router.use('/credentials', require('./credentials'));
router.post('/credentials/issue-unified', async (req, res, next) => { require('./credentials'); next(); });

module.exports = router;
