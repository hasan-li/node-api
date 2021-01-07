/* eslint-disable no-console */
/**
 * Module dependencies.
 */
const bodyParser = require('body-parser');
const chalk = require('chalk');
const compression = require('compression');
const dotenv = require('dotenv');
// const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const errorHandler = require('errorhandler');
const express = require('express');
const session = require('express-session');
const lusca = require('lusca');
const MongoStore = require('connect-mongo')(session);
const path = require('path');
const mongoose = require('mongoose');
const log4js = require('log4js');
mongoose.Promise = require('bluebird');
const passport = require('passport');
const cors = require('cors');
const cookieParser = require('cookie-parser');

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
let envPath = '.env';
envPath += process.env.NODE_ENV === 'production' ? '.production' : '.development';
dotenv.load({ path: envPath });

require('./config/passport');

log4js.configure('./config/log4js.json');
const log = log4js.getLogger('index');

/**
 * Create Express server.
 */
const app = express();

/**
 * Setup Cors
 */

app.use(cors({
	credentials: true,
  origin: [process.env.APP_ADDRESS, process.env.ADMIN_APP_ADDRESS]
}));

/**
 * Connect to MongoDB.
 */
mongoose.Promise = global.Promise;
mongoose.set('useFindAndModify', false);

const mongooseOptions = {
	keepAlive: 300000,
	connectTimeoutMS: 30000,
	useNewUrlParser: true,
	poolSize: 15,
	socketTimeoutMS: 300000,
	useUnifiedTopology: true,
};

try {
	mongoose.connect(process.env.MONGODB_URI || process.env.MONGOLAB_URI, mongooseOptions);
	mongoose.set('useCreateIndex', true);
	mongoose.connection.on('error', (err) => {
		log.error('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
		throw new Error('%s MongoDB connection error. Please make sure MongoDB is running.', err);
	});
} catch (e) {
	log.error('error occured during connection to mongo server', { e });
}

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.enable('view cache');

app.use(cookieParser());
app.use(expressStatusMonitor());
app.use(compression());

// app.use(expressValidator());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(session({
	resave: true,
	saveUninitialized: true,
	secret: process.env.SESSION_SECRET,
	cookie: { maxAge: 1209600000 },
	store: new MongoStore({
		url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
		autoReconnect: true
	})
}));

/**
 * initialize passport
 */
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());

app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));

// app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));
app.use(express.static(__dirname + '/public'));

app.use((req, res, next) => {
	// After successful login, redirect back to the intended page
	if (!req.user &&
		req.path !== '/login' &&
		req.path !== '/signup' &&
		!req.path.match(/^\/auth/) &&
		!req.path.match(/^\/login/) &&
		!req.path.match(/\./)) {
		req.session.returnTo = req.originalUrl;
	} else if (req.user) {
		req.session.returnTo = req.originalUrl;
	}
	next();
});


/**
 * Controllers (route handlers).
 */
const categoryController = require('./controllers/category/index');
const sourceCategoryController = require('./controllers/sourceCategory/index');
const unsortedController = require('./controllers/unsorted/index');
const sourceController = require('./controllers/source/index');
const newsController = require('./controllers/news/index');
const userController = require('./controllers/user/index');
const adminController = require('./controllers/admin/index');
// const socialMediaController = require('./controllers/socialMedia/index');

/**
 * =================================================================================
 * Primary app routes.
 * =================================================================================
 */
app.use('/categories', categoryController.router);
app.use('/source-categories', sourceCategoryController.router);
app.use('/unsorteds', unsortedController.router);
app.use('/auth', userController.router);
app.use('/news', newsController.router);
app.use('/source', sourceController.router);
app.use('/admin', adminController.router);
// app.use('/social-media', socialMediaController.router);

/**
 * Error Handler.
 */
if (process.env.NODE_ENV === 'development') {
	// only use in development
	app.use(errorHandler());
}

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
	console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
	console.log('  Press CTRL-C to stop\n');
});

module.exports = app;
