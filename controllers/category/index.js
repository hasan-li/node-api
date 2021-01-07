const passport = require('passport');
const express = require('express');
const router = express.Router();

const categories = require('./categories');

/**
* Gets all existing categories
*/
router.get(
	'/get/all',
	categories.getAllCategories
);

/**
* Gets all categories which have at least one news
*/
router.get(
	'/get/not-empty',
	categories.getAllNotEmptyCategories
);

/**
* Returns all categories with numbert of news for each
*/
router.get(
	'/get/news-number',
	passport.authenticate('jwt', { session: false }),
	categories.getNumberOfNewsPerCategory
);

/**
* Returns all categories with numbert of news for each
*/
router.post(
	'/post/remove',
	passport.authenticate('jwt', { session: false }),
	categories.removeCategory
);

/**
 * GET
 * Create new Category
 * REST params
 * name: name of the category (camelCase)
*/
router.get(
	'/get/create/',
	passport.authenticate('jwt', { session: false }),
	categories.createNewCategory
);

/**
 * POST
 * Updates categories
 * Body can contain any data that should be updated.
 * Fields which should not be updated shouyl not be sent
 * _id shoud always be presented
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
router.post(
	'/post/update/',
	passport.authenticate('jwt', { session: false }),
	categories.updateCategories
);

/**
 * POST
 * set user's categories
 * id: String - userId
 * categories: [String] - list of categories
 */
router.post(
	'/user/set/',
	passport.authenticate('jwt', { session: false }),
	categories.setCategories
);

/**
 * Gets news for one category
 * REST params
 * id: category _id
 * page: number of page (int)
 * limit: number of items per page (int)
*/
// app.get('/get/news/category', indexController.getAllNewsForOneCategory);

/**
 * GET
 * returns category by its id
 * ?id=String
 */
router.get(
	'/get/item/',
	categories.getCategoryItem
);

module.exports.router = router;
