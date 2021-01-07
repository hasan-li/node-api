const passport = require('passport');
const express = require('express');
const router = express.Router();

const source = require('./source');

/**
 * POST
 * Add new sources in an array
 * @param {String} key
 */
router.post(
	'/add/',
	passport.authenticate('jwt', {session: false}),
	source.addSource
);

/**
 * Update already existing source
 * Mandatory params:
 * @param {String} url
 * @param {String} officialName
 * Optional params:
 * @param {String} newsUrl
 * @param {String} encoding
 * @param {String} logo
 * @param {String} description
 * @param {String} baseColor
 * @param {String} display
 * @param {String} facebook
 * @param {String} twitter
 * @param {String} instagram
 * @param {String} googlePlus
 * Language array
 * lang array should contain already existing values and new values
 * otherwise existing values will be removed
 * @param {Array} lang
 */
// app.get('/update/source/', indexController.updateSource);

module.exports.router = router;
