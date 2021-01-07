const passportJWT = require('passport-jwt');
const bcrypt = require('bcrypt');
const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const localStrategy = require('passport-local').Strategy;
const passport = require('passport');
const log4js = require('log4js');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const AdminUser = require('../models/AdminUser');
const jwtSecret = require('./keys').jwtSecret;
const refreshTokenSecret = require('./keys').refreshTokenSecret;
const { setUserTokens, getUserTokens } = require('../services/redisService');

log4js.configure('./config/log4js.json');
const log = log4js.getLogger('config-passport');

const BCRYPT_SALT_ROUNDS = 12;

passport.serializeUser((user, done) => {
	done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
	const user = await User.findById(id);
	done(null, user);
});

passport.use(
	new GoogleStrategy({
		callbackURL: `${process.env.SELF_ADDRESS}/auth/google/redirect`,
		clientID: '',
		clientSecret: ''
	}, async (_, __, profile, done) => {
		try {
			const userDoc = await User.findOne({
				externalId: profile.id
			});
			let user = undefined;
			if (userDoc) {
				const updatedUser = await checkIfUserDataUpdated(userDoc._doc, profile);
				user = updatedUser;
			} else {
				user = new User({
					externalId: profile.id,
					email: profile.emails[0].value,
					displayName: profile.displayName,
					firstName: profile.name.givenName,
					secondName: profile.name.familyName,
					gender: profile._json.gender,
					externalLocale: profile._json.locale,
					provider: profile.provider,
					picture: profile.photos[0].value
				});
				await user.save();
			}
			const userTokenObj = {
				externalId: user.externalId,
				email: user.email,
				displayName: user.displayName,
				gender: user.gender,
				provider: user.provider,
				_id: user._id
			};
			const userTokens = await getUserTokens(user._id);
			if (userTokens) {
				const token = jwt.sign(userTokenObj, jwtSecret, {
					expiresIn: '1h'
				});
				user.token = token;
				jwt.verify(userTokens.refreshToken, refreshTokenSecret, async (err) => {
					let refreshToken;
					if (err) {
						refreshToken = jwt.sign(userTokenObj, refreshTokenSecret);
					} else {
						refreshToken = userTokens.refreshToken;
					}
					user.refreshToken = refreshToken;
					await setUserTokens(user._id, token, refreshToken);
				});
			} else {
				const token = jwt.sign(userTokenObj, jwtSecret, {
					expiresIn: '1h'
				});
				const refreshToken = jwt.sign(userTokenObj, refreshTokenSecret);
				user.token = token;
				user.refreshToken = refreshToken;
				await setUserTokens(user._id, token, refreshToken);
			}
			done(null, user);
		} catch (e) {
			log.error('error occured during logging with google', e);
		}
	})
);

passport.use(
	new FacebookStrategy({
		callbackURL: `${process.env.SELF_ADDRESS}/auth/facebook/redirect`,
		clientID: '',
		clientSecret: '',
		profileFields: [
			'id',
			'emails',
			'name',
			'gender',
			'locale',
			'displayName',
			'picture.type(large)',
			'short_name',
			'name_format',
		]
	}, async (_, __, profile, done) => {
		try {
			const userDoc = await User.findOne({
				externalId: profile.id
			});
			let user = undefined;
			if (userDoc) {
				const updatedUser = await checkIfUserDataUpdated(userDoc._doc, profile);
				user = updatedUser;
			} else {
				user = new User({
					externalId: profile.id,
					email: profile.emails[0].value,
					displayName: profile.displayName,
					firstName: profile.name.givenName,
					secondName: profile.name.familyName,
					gender: profile._json.gender,
					provider: profile.provider,
					picture: profile.photos[0].value
				});
				await user.save();
			}
			const userTokenObj = {
				externalId: user.externalId,
				email: user.email,
				displayName: user.displayName,
				gender: user.gender,
				provider: user.provider,
				_id: user._id
			};

			const userTokens = await getUserTokens(user._id);
			if (userTokens) {
				const token = jwt.sign(userTokenObj, jwtSecret, {
					expiresIn: '1h'
				});
				user.token = token;
				jwt.verify(userTokens.refreshToken, refreshTokenSecret, async (err) => {
					let refreshToken;
					if (err) {
						refreshToken = jwt.sign(userTokenObj, refreshTokenSecret);
					} else {
						refreshToken = userTokens.refreshToken;
					}
					user.refreshToken = refreshToken;
					await setUserTokens(user._id, token, refreshToken);
				});
			} else {
				const token = jwt.sign(userTokenObj, jwtSecret, {
					expiresIn: '1h'
				});
				const refreshToken = jwt.sign(userTokenObj, refreshTokenSecret);
				user.token = token;
				user.refreshToken = refreshToken;
				await setUserTokens(user._id, token, refreshToken);
			}
			done(null, user);
		} catch (e) {
			log.error('error occured during logging with facebook', e);
		}
	})
);

passport.use(new JWTStrategy({
	jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
	secretOrKey: jwtSecret,
}, (jwtPayload, done) => {
	if (!jwtPayload._id) {
		AdminUser.findOne({
			email: jwtPayload.id
		}).
			then((user) => done(null, user)).
			catch((err) => done(err));
		return;
	}
	User.findById(jwtPayload._id).
		then((user) => done(null, user)).
		catch((err) => done(err));
}));

passport.use(
	'register',
	new localStrategy({
		usernameField: 'email',
		passwordField: 'password',
		session: false,
	}, (email, password, done) => {
		try {
			AdminUser.findOne({
				email
			}).then((user) => {
				if (user) {
					return done(null, user, {
						message: 'username already taken'
					});
				}
				bcrypt.hash(password, BCRYPT_SALT_ROUNDS).then((hashedPassword) => {
					AdminUser.create({
						email,
						password: hashedPassword
					}).then((user) =>
						// note the return needed with passport local - remove this return for passport JWT to work
						done(null, user)
					);
				});
			});
		} catch (err) {
			done(err);
		}
	}),
);

passport.use(
	'login',
	new localStrategy({
		usernameField: 'email',
		passwordField: 'password',
		session: false,
	}, (email, password, done) => {
		try {
			AdminUser.findOne({
				email
			}).then((user) => {
				if (user === null) {
					return done(null, false, {
						message: 'bad email'
					});
				}
				bcrypt.compare(password, user.password).then((response) => {
					if (response !== true) {
						return done(null, false, {
							message: 'passwords do not match'
						});
					}
					// note the return needed with passport local - remove this return for passport JWT
					return done(null, user);
				});
			});
		} catch (err) {
			done(err);
		}
	}),
);

const checkIfUserDataUpdated = async (mhUser, profile) => {
	let updateUser = false;
	if (mhUser.externalId !== profile.id) {
		mhUser.externalId = profile.id;
		updateUser = true;
	}
	if (mhUser.email !== profile.emails[0].value) {
		mhUser.email = profile.emails[0].value;
		updateUser = true;
	}
	if (mhUser.displayName !== profile.displayName) {
		mhUser.displayName = profile.displayName;
		updateUser = true;
	}
	if (mhUser.firstName !== profile.name.givenName) {
		mhUser.firstName = profile.name.givenName;
		updateUser = true;
	}
	if (mhUser.secondName !== profile.name.familyName) {
		mhUser.secondName = profile.name.familyName;
		updateUser = true;
	}
	if (mhUser.gender !== profile._json.gender) {
		mhUser.gender = profile._json.gender;
		updateUser = true;
	}
	if (mhUser.externalLocale !== profile._json.locale) {
		mhUser.externalLocale = profile._json.locale;
		updateUser = true;
	}
	if (mhUser.provider !== profile.provider) {
		mhUser.provider = profile.provider;
		updateUser = true;
	}
	if (mhUser.picture !== profile.photos[0].value) {
		mhUser.picture = profile.photos[0].value;
		updateUser = true;
	}

	if (updateUser) {
		const query = await User.findOneAndUpdate({ _id: mhUser._id }, mhUser);
		if (!query) {
			log.error('error occured while updating user', { _id: mhUser._id });
		}
	}

	return mhUser;
};
