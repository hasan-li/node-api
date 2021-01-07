const express = require('express');
const router = express.Router();

const socialMediaOperations = require('./socialMediaOperations');

/**
 * POST
 * add social media source
 * */
router.post(
	'/add/source',
	socialMediaOperations.addSocialMediaSource,
);

/**
 * POST
 * add social media author
 * */
router.post(
	'/add/author',
	socialMediaOperations.addSocialMediaAuthor,
);

/**
 * POST
 * add social media author
 * */
router.post(
	'/get/content/paginated',
	socialMediaOperations.getPaginatedSocialMediaContent,
);

module.exports.router = router;
