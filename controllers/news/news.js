const log4js = require('log4js');
const mongoose = require('mongoose');
const passport = require('passport');
const { validationResult } = require('express-validator');

const News = require('../../models/News');
const isValidObjectId = require('./../common').isValidObjectId;
const { authUserPaginatedNews, nonAuthUserPaginatedNews } = require('./services');

log4js.configure('./config/log4js.json');
const log = log4js.getLogger('controller-news-news');


/**
 * GET
 * returns article by its id
 * ?id=String
 */
module.exports.getNewsItem = async (req, res) => {
	if (!req.query.id) {
		log.warn('id of the article is not present', {});
		res.status(422).json({ status: 'id of the article is not present' });
		return;
	}

	if (!isValidObjectId(req.query.id)) {
		log.warn('id is in wrong format', { id: req.query.id });
		res.status(422).json({ status: 'id is in wrong format' });
		return;
	}
	const id = req.query.id;

	const articleDoc = await News.findById(id).populate([
		{
			path: 'category',
			select: 'name _id',
		},
		{
			path: 'source',
			select: 'url officialName -_id',
		},
	]);
	if (!articleDoc) {
		log.warn('article was not found', { id: req.query.id });
		res.status(404).json({ status: 'article was not found' });
		return;
	}
	const article = articleDoc._doc;
	return res.status(200).json(article);
};

/**
 * POST
 * Returns all existing (paginated) news which have display property set to true
 * If Authorization header is not present or not valid will just return lates news withot checkking categories
 * @params
 * body:
 * {
  "page": 1, - mandatory
  "limit": 10, - optional
  "lang": ["az"],  - optional
  "categoryIds": [  - optional
    "123456789dassadas",
    "123456789dassadas",
    "123456789dassadas"
  ]
}
*/
module.exports.getPaginatedNews = (req, res, next) => {
	const user = req.user;
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(422).json({ errors: errors.array() });
	}
	const page = parseInt(req.body.page, 10);
	const limit = req.body.limit ? parseInt(req.body.limit, 10) : 10;
	const { lang: langArr = [] } = req.body;
	const { categoryIds = [] } = req.body;

	if (user) {
		authUserPaginatedNews(user._id, page, limit, true, res);
	} else {
		nonAuthUserPaginatedNews(page, limit, categoryIds, langArr, true, res);
	}
};

/**
 * GET
 * Increment view numbers for article
 * @param id=1233435433dsadjaljd
 */
module.exports.incrementClick = async (req, res) => {
	if (!req.query.id) {
		log.warn('id of the article is not present', {});
		res.status(422).json({ status: 'id of the article is not present' });
		return;
	}

	if (!isValidObjectId(req.query.id)) {
		log.warn('id is in wrong format', { id: req.query.id });
		res.status(422).json({ status: 'id is in wrong format' });
		return;
	}
	const { id } = req.query;

	const article = await News.findById(id);
	if (!article) {
		res.status(400).json({ status: 'No article found' });
		return;
	}
	article.clickNum = article.clickNum ? ++article.clickNum : 1;

	await article.save();
	res.status(200).json({
		id,
		status: 'ok',
	});
};

module.exports.getPaginatedArticles = (req, res, next) => {
	passport.authenticate('jwt', { session: false }, (authErr, tokenUser) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}
		if (authErr) {
			log.error('error occured while jwt auth', authErr);
			return;
		}

		const page = parseInt(req.body.page, 10);
		const limit = req.body.limit ? parseInt(req.body.limit / 2, 10) : 10;
		const { lang: langArr = [] } = req.body;
		const { categoryIds = [] } = req.body;

		if (tokenUser) {
			authUserPaginatedNews(tokenUser._id, page, limit, true, res);
		} else {
			nonAuthUserPaginatedNews(page, limit, categoryIds, langArr, true, res);
		}
	})(req, res, next);
};

/**
 * POST
 * body
 * {
* 	_id: articleId: String,
* 	display: displayArticle: Boolean,
* 	category: categoryId: String,
* 	language: articleLanguage: String
 * }
 */

module.exports.updateArticle = async (req, res) => {
	// someone already responded
	if (res._header) { return; }

	if (!req.body) {
		log.warn('request body with source is not present', {});
		res.status(422).json({ status: 'request body with source is not present' });
		return;
	}
	try {
		const { _id, display, category, language } = req.body;
		const categoryObjectId = mongoose.Types.ObjectId(category);

		const updateData = {
			display,
			category: categoryObjectId,
			language
		};

		const foundArticle = await News.findByIdAndUpdate(_id, updateData);

		if (!foundArticle) {
			log.warn('article was not found', { _id });
			res.status(404).json({ status: 'article was not found', _id });
		}

		res.status(200).json({ status: 'updated', _id });
	} catch (e) {
		log.error();
	}
};

/**
 * GET
 * Remove article
 */
module.exports.removeArticle = async (req, res) => {
	const articleId = req.query.articleId;
	if (!articleId) {
		log.warn('article id is not present', {});
		res.status(422).json({ status: 'article id is not present' });
		return;
	}
	const query = await News.findOneAndDelete({ _id: articleId });
	if (query._id.toString() === articleId.toString()) {
		res.status(200).json({ status: 'ok', message: `article ${articleId} was removed` });
	} else {
		res.status(500).json({ status: 'error', message: `error occured while removing article ${articleId}` });
	}
};