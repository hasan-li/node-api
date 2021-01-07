const express = require('express');
const router = express.Router();
const passport = require('passport');
const log4js = require('log4js');

log4js.configure('./config/log4js.json');
const log = log4js.getLogger('user-index');
const { removeUserTokens } = require('../../services/redisService');
const { authenticateToken, checkToken } = require('./services');
const User = require('../../models/User');

/**
 * Google login url
 */
router.get(
	'/login/google',
	passport.authenticate(
		'google',
		{
			scope: ['profile', 'email'],
			accessType: 'offline',
			prompt: 'consent',
			session: false,
	}
	),
	(req, res) => {
		log.debug('login/google', { req, res });
	});

/**
 * Google redirect url to the app
 */
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
	if (process.env.NODE_ENV === 'production') {
		res.cookie('token', req.user.token, { httpOnly: false, domain: '.example.com', secure: true });
	} else {
		res.cookie('token', req.user.token);
		res.cookie('refreshToken', req.user.refreshToken);
	}
	res.redirect(`${process.env.APP_ADDRESS}`);
});

/**
 * Facebook login url
 */
router.get('/login/facebook', passport.authenticate('facebook', { scope: ['email'] }));

/**
 * Facebook redirect url to the app
 */
router.get('/facebook/redirect', passport.authenticate('facebook'), (req, res) => {
	res.cookie('token', req.user.token, { httpOnly: false, domain: '.example.com', secure: true });
	res.redirect(`${process.env.APP_ADDRESS}`);
});

/**
 * Get user's data
*/
router.get('/me', authenticateToken, async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user) return res.sendStatus(403);
		res.json(user);

	} catch (e) {
		if (e) return res.sendStatus(403);
		log.error('e', { error: e });
	}
});

/**
 * Extend access token's life using refresh token
*/
router.get('/token/extend', checkToken, (req, res) => {
	if (process.env.NODE_ENV === 'production') {
		res.cookie('token', req.token, { httpOnly: false, domain: '.example.com', secure: true });
	} else {
		res.clearCookie('token');
		res.cookie('token', req.token, { secure: false, httpOnly: false });
	}
	res.json({ message: 'ok' });
});

router.get('/logout', authenticateToken, async (req, res) => {
	await removeUserTokens(req.user._id);
	res.clearCookie('token');
	res.clearCookie('refreshToken');
	res.json({ message: 'ok' });
});

module.exports.router = router;
