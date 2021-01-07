const passport = require('passport');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const sourceCategories = require('./sourceCategories');
/**
 * GET
 * Returns all source categories docs
 */
router.post(
	'/get/paginated/',
	// passport.authenticate('jwt', {session: false}),
	[
		body('page').exists().
			isInt(),
		body('limit').optional().
			isInt(),
	],
	sourceCategories.getPaginatedSourceCategories
);

/**
 * GET
 * Remove source categories by id
 */
router.get(
	'/get/remove/',
	passport.authenticate('jwt', { session: false }),
	sourceCategories.removeSourceCategory
);

/**
 * POST
 * Update source categories
 * body: [
	* {
		"_id": "5be2fafed62e1e1f247c18bd",
		"mediaHubCategory": "5be2fafed62e1e1f247c18bd"
	* },
	* {
		"_id": "12345hdkjsahda12312ds1d",
		"mediaHubCategory": "12345hdkjsahda12312ds1d"
	* },
 * ]
 */
router.post(
	'/post/update/',
	passport.authenticate('jwt', { session: false }),
	sourceCategories.updateSourceCategory
);

/**
 * GET
 * returns source category by its id
 * ?id=String
 */
router.get(
	'/get/item/',
	sourceCategories.getSourceCategoryItem
);

module.exports.router = router;
