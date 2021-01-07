const log4js = require('log4js');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const AdminUser = require('../../models/AdminUser');

log4js.configure('./config/log4js.json');
const log = log4js.getLogger('controller-admin');

const jwtSecret = require('./../../config/keys').jwtSecret;

/**
 * POST
 * Updates categories
 * Body can contain any data that should be updated.
 * Fields which should not be updated shouyl not be sent
 * _id shoudl always be presented
 * body: [
	* {
		"_id": "5be2fafed62e1e1f247c18bd",
		"label": {
			"az": "kompyuterlər",
			"ru": "компьютеры"
		}
	* },
	* {
		"_id": "12345hdkjsahda12312ds1d",
		"name": "helloWorld"
	* },
 * ]
 */
module.exports.createUser = (req, res, next) => {
	passport.authenticate('register', (err, user, info) => {
		if (err) {
			log.error('Error while creting user', err);
		}
		if (info !== undefined) {
			res.send(info.message);
			return;
		}
		res.json({ status: 'user created' });
	})(req, res, next);
};

module.exports.loginUser = (req, res, next) => {
	passport.authenticate('login', (err, user, info) => {
		if (err) {
			log.error('error occured while logging in', err);
		}
		if (info === undefined) {
			req.logIn(user, (err) => {
				if (err) {
					log.error('error occured', err);
				}
				AdminUser.findOne({ email: user.email }).then((user) => {
					const token = jwt.sign({ id: user.email }, jwtSecret, { expiresIn: '7d' });
					res.status(200).send({
						auth: true,
						token,
						message: 'user found & logged in',
					});
				});
			});
		} else {
			res.send(info.message);
		}
	})(req, res, next);
};
