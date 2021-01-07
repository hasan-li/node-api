const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const passport = require('passport');

const news = require('./news');
const { authenticateToken, checkToken } = require('../user/services');

/**
 * GET
 * populate news from all sources
 */
// router.get(
// 	'/populate/data',
// 	passport.authenticate('jwt', {session: false}),
// 	news.index
// );

/**
 * GET
 * returns article by its id
 * ?id=String
 */
router.get(
	'/get/article',
	news.getNewsItem
);

/**
 * POST
 * Returns all existing (paginated) news which have display property set to true
 * If Authorization header is not present or not valid will just return latest news without checking categories
 * @params
 * body:
 * {
	"page": 1,
	"limit": 10,
	"lang": ["az"],
	"categoryId": [
		"123456789dassadas",
		"123456789dassadas",
		"123456789dassadas"
	]
}
*/
router.post(
	'/get/paginated',
	[
		body('page').exists().
			isInt(),
		body('limit').optional().
			isInt(),
		body('lang').optional().
			isArray(),
		body('categoryId').optional().
			isArray(),
	],
	(req, res, next) => authenticateToken(req, res, next, true),
	news.getPaginatedNews
);

/**
 * Gets news from one source
 * REST params
 * name: source name
 * page: number of page (int)
 * limit: number of items per page (int)
*/
// router.get('/get/news/source', indexController.getAllNewsForOneSource);

/**
 * Increments number of clicks on item
 * REST params
 * id: _id of news
*/
router.get(
	'/increment/click/',
	news.incrementClick
);

/**
 * POST
 * Returns articles from both news sources and social media
 * (paginated) news which have display property set to true
 * If Authorization header is not present or not valid will just return latest articles withot checkking categories
 * @params
 * body:
 * {
	"page": 1,
	"limit": 10,
	"lang": ["az"],
	"categoryId": [
		"123456789dassadas",
		"123456789dassadas",
		"123456789dassadas"
	]
}
*/
router.post(
	'/all/sources/',
	news.getPaginatedArticles
);


/**
 * POST
 * Updating article
 * body
 * {
* 	_id: articleId: String,
* 	display: displayArticle: Boolean,
* 	category: categoryId: String,
* 	language: articleLanguage: String
 * }
 */

router.post(
	'/post/update/',
	passport.authenticate('jwt', { session: false }),
	news.updateArticle
);

/**
 * GET
 * Remove article
 */

router.get(
	'/get/remove/',
	passport.authenticate('jwt', { session: false }),
	news.removeArticle
);

module.exports.router = router;
