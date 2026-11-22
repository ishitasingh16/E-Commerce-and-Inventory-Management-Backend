const router = require('express').Router();
const auth = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { requiredFields } = require('../middleware/validate');

router.post('/register', requiredFields(['name', 'email', 'password']), auth.register);
router.post('/login', requiredFields(['email', 'password']), auth.login);
router.post('/refresh', requiredFields(['refreshToken']), auth.refresh);
router.post('/logout', requireAuth, auth.logout);

module.exports = router;
