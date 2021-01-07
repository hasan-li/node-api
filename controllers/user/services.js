const log4js = require('log4js');
const passportJWT = require('passport-jwt');
const ExtractJWT = passportJWT.ExtractJwt;
const jwt = require('jsonwebtoken');

log4js.configure('./config/log4js.json');
const log = log4js.getLogger('controller-user-services');
const jwtSecret = require('../../config/keys').jwtSecret;
const refreshTokenSecret = require('../../config/keys').refreshTokenSecret;
const { setUserTokens, getUserTokens, removeUserTokens } = require('../../services/redisService');

function authenticateToken(req, res, next, proceedWithoutToken = false) {
	const token = ExtractJWT.fromAuthHeaderAsBearerToken()(req);
	if (token === null) {
    if (proceedWithoutToken) {
      req.user = null;
      next();
      return;
    }
    return res.sendStatus(401);
  }

	jwt.verify(token, jwtSecret, async (err, user) => {
		if (err) return res.sendStatus(403);
		
		const userTokens = await getUserTokens(user._id);
		if (!userTokens) return res.sendStatus(403);

		req.user = user;
		next();
	});
}

function checkToken(req, res, next) {
	const refreshToken = ExtractJWT.fromAuthHeaderAsBearerToken()(req);
	if (refreshToken === null) return res.sendStatus(401);

	jwt.verify(refreshToken, refreshTokenSecret, async (err, user) => {
		if (err) {
			res.clearCookie('token');
			res.clearCookie('refreshToken');
			return res.sendStatus(403);
		}

		delete user.iat;
		const userTokens = await getUserTokens(user._id);
		// const userTokens = JSON.parse(userTokensRaw);
		if (userTokens && userTokens.refreshToken !== refreshToken) {
			await removeUserTokens(user._id);
			return res.sendStatus(403);
		}

		const newAccessToken = jwt.sign(user, jwtSecret, {
			expiresIn: '1h'
		});

		await setUserTokens(user._id, newAccessToken, refreshToken);

		req.token = newAccessToken;
		next();
	});
}

module.exports = { authenticateToken, checkToken };