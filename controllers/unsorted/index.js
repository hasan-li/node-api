const passport = require('passport');
const express = require('express');
const router = express.Router();

const unsorteds = require('./unsorteds');

/**
 * POST
 * Binds new source category to mediaHub Category
 * body:
 * [
 * 	{
 * 		unsortedId: String,
 * 		categoryId: String,
 * 	},
 * ]
*/
router.post(
	'/post/bind/category/',
	passport.authenticate('jwt', {session: false}),
	unsorteds.bindUnsortedToCategory
);

/**
 * GET
 * Returns all unsorteds docs
 */
router.get(
	'/get/all/',
	passport.authenticate('jwt', {session: false}),
	unsorteds.getAllUnsorteds
);

/**
 * GET
 * returns unsorted category by its id
 * ?id=String
 */
router.get(
	'/get/item/',
	unsorteds.getUnsortedCategoryItem
);

/**
 * GET
 * Remove unsorted category by id
 */
router.get(
	'/get/remove/',
	passport.authenticate('jwt', {session: false}),
	unsorteds.remove
);

module.exports.router = router;
