const log4js = require('log4js');
const each = require('async/each');

// models
const SocialMediaSource = require('../../models/SocialMediaSource');
const SocialMediaAuthor = require('../../models/SocialMediaAuthor');
const SocialMediaArticle = require('../../models/SocialMediaArticle');

// configure logger
log4js.configure('./config/log4js.json');
const log = log4js.getLogger('controller-social-media-operations');

const languages = require('./../configs/commonData').languages;

/**
 * POST
 * add social media source(s)
 * body should contain array of sources
 * sorces should have Model described in models/SocialMediaSource
 */
module.exports.addSocialMediaSource = (req, res) => {
	if (res._header) { return; } // someone already responded

	if (!req.body || !Array.isArray(req.body)) {
		log.error('request body with source is not present', {});
		res.status(422).json({status: 'request body with source is not present'});
		return;
	}

	each(req.body, (item, callback) => {
		if (!item.name || !item.url) {
			callback('All objects must have name and url fields!');
			return;
		}
		let query = { profileName: item.name, profileUrl: item.url };
		let update = item;
		let options = { upsert: true, new: true, setDefaultsOnInsert: true };

		SocialMediaSource.findOneAndUpdate(query, update, options, (err, source) => {
			if (err) {
				callback(err);
			}
			if (!source) {
				log.warn('No source found for: ', { name: item.name });
			}
			callback();
		});
	}, (err) => {
		if (err) {
			log.error(err.toString());
			res.status(422).json({status: err});
			return;
		}
		res.status(200).json({status: 'Source(s) added'});
		log.info('Social media source was added', {});
	});
};

/**
 * POST
 * add social media authors(s)
 * body should contain array of authors
 * sorces should have Model described in models/SocialMediaAuthor
 */
module.exports.addSocialMediaAuthor = (req, res) => {
	if (res._header) { return; } // someone already responded

	if (!req.body || !Array.isArray(req.body)) {
		log.error('request body with author is not present', {});
		res.status(422).json({status: 'request body with source is not present'});
		return;
	}

	each(req.body, (item, callback) => {
		if (!item.name || !item.profileUrl) {
			log.error('All objects must have name and url fields!', item);
			callback('All objects must have name and url fields!');
			return;
		}
		let query = { profileName: item.name, profileUrl: item.profileUrl };
		let update = item;
		let options = { upsert: true, new: true, setDefaultsOnInsert: true };

		SocialMediaAuthor.findOneAndUpdate(query, update, options, (err, source) => {
			if (err) {
				callback(err);
			}
			if (!source) {
				log.warn('No author found for: ', { name: item.name });
			}
			callback();
		});
	}, (err) => {
		if (err) {
			log.error(err.toString());
			res.status(422).json({status: err});
			return;
		}
		res.status(200).json({status: 'Author(s) added'});
		log.info('Social media author was added', {});
	});
};


/**
 * * POST
 * Returns all existing (paginated) SC media articles
 * No Authorization header is needed
 * @params
 * body:
 * {
	"page": 1,
	"limit": 10,
	"lang": ["az"],
}
*/
module.exports.getPaginatedSocialMediaContent = (req, res) => {
	let page = req.body.page;
	let limit = req.body.limit;
	let lang = req.body.lang;
	let query = {};

	if (!page) {
		res.status(422).json({status: 'please enter page'});
		return;
	}
	if (!limit) {
		res.status(422).json({status: 'please enter limit'});
		return;
	}
	if (!lang) {
		res.status(422).json({status: 'please enter language'});
		return;
	}
	// check if multiple languages was sent and define query
	if (Array.isArray(lang)) {
		query = { $or: [] };
		for (let i = 0; i < lang.length; i++) {
			if (!(languages.indexOf(lang[i]) > -1)) {
				res.status(422).json({status: 'unsopported language was sent'});
				return;
			}
			query.$or.push({language: lang[i] });
		}
	}
	else {
		if (!(languages.indexOf(lang) > -1)) {
			res.status(422).json({status: 'unsopported language was sent'});
			return;
		}
		query = {language: lang};
	}
	page = parseInt(page, 10);
	limit = parseInt(limit, 10);

	query.display = true;
	const options = {
		page,
		limit,
		populate: [
			{
				path: 'author',
				select: '-_id -createdAt -updatedAt -saveDataFunction -display -language -__v -source',
				populate: {
					path: 'category',
					select: '-mainCategory -createdAt -updatedAt -__v',
				},
			},
			{
				path: 'source',
				select: '-language -_id -createdAt -updatedAt -__v',
			}
		],
		sort: { createdAt: 'desc' },
		select: '-createdAt -updatedAt -title',
	};
	SocialMediaArticle.paginate(query, options, (err, result) => {
		if (err) {
			log.error('error occured while getting news', { error: err.toString() });
			res.status(404).json({
				status: 'error occured while getting news',
				error: err.toString()
			});
			return;
		}
		if (!result) {
			res.status(500).json({status: 'no news was found for page #' + page});
			return;
		}
		res.status(200).json(result);
	});

};
