const each = require('async/each');
const log4js = require('log4js');
const merge = require('lodash/merge');
const passport = require('passport');
const { validationResult } = require('express-validator');

const isValidObjectId = require('./../common').isValidObjectId;
const SourceCategory = require('../../models/SourceCategory');

log4js.configure('./config/log4js.json');
const log = log4js.getLogger('controller-source-category');

/**
 * GET
 * Returns all source categories
 */
module.exports.getPaginatedSourceCategories = (req, res) => {
	passport.authenticate('jwt', { session: false }, async (authErr, tokenUser) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}
		if (authErr) {
			log.error('error occured while jwt auth', authErr);
			return;
		}


		if (tokenUser) {
			const page = parseInt(req.body.page, 10);
			const limit = req.body.limit ? parseInt(req.body.limit, 10) : 10;
			const options = getPaginationOptions(page, limit);
			try {
				const sourceCategoriesRaw = await SourceCategory.paginate({}, options);
				res.status(200).json(sourceCategoriesRaw);
			} catch (e) {
				log.error('error occured while getting source categories from db', e);
				res.status(404).json({
					status: 'error occured while getting source categories',
					error: e.toString(),
				});
			}
		} else {
			res.status(200).json({ message: 'token was not sent' });
		}
	})(req, res);
};

const getPaginationOptions = (page, limit) => ({
	page,
	limit,
	populate: [
		{
			path: 'mediaHubCategory',
			select: 'name label _id',
		},
	],
	sort: { createdAt: 'desc' },
});


/**
 * GET
 * Remove source category
 */
module.exports.removeSourceCategory = async (req, res) => {
	if (!req.query.sourceCategoryId) {
		log.warn('source category id is not present', {});
		res.status(422).json({ status: 'source category id is not present' });
		return;
	}
	const sourceCategoryId = req.query.sourceCategoryId;
	const query = await SourceCategory.findOneAndDelete({ _id: sourceCategoryId });
	if (query._id.toString() === sourceCategoryId.toString()) {
		res.status(200).json({ status: 'ok', message: `source category ${sourceCategoryId} was removed` });
	} else {
		res.status(500).json({ status: 'error', message: `error occured while removing source category ${sourceCategoryId}` });
	}
};


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
module.exports.updateSourceCategory = (req, res) => {
	// someone already responded
	if (res._header) { return; }

	if (!req.body || !Array.isArray(req.body)) {
		log.warn('request body with source is not present', {});
		res.status(422).json({ status: 'request body with source is not present' });
		return;
	}

	const sourcecategoriesIdsQuery = [];
	// create query for finding by ids all categories from body
	for (let i = 0; i < req.body.length; i++) {
		sourcecategoriesIdsQuery.push({
			_id: req.body[i]._id,
		});
	}

	SourceCategory.find().or(sourcecategoriesIdsQuery).
		then((srcCategoriesDocs) => {
			each(srcCategoriesDocs, async (doc, cb) => {
				const srcCategory = doc._doc;
				const srcCategoryWithNewValues = req.body.find((bodySrcCategory) =>
					bodySrcCategory._id.toString() === srcCategory._id.toString()
				);
				const updated = new SourceCategory(merge(srcCategory, srcCategoryWithNewValues));
				const query = await SourceCategory.findOneAndUpdate({ _id: updated._id.toString() }, updated, (err, doc) => {
					if (err) {
						log.error('error occured while updating source category', err);
					}
					if (!doc) {
						log.error('source category was not found. id:', { id: updated._id.toString() });
					}
				});
				if (!query) {
					log.error('error occured during updating category', { name: srcCategory.name, _id: srcCategory._id });
				}
				cb();
			}, () => {
				res.status(200).json({ status: 'ok' });
			});
		});
};

/**
 * GET
 * returns source category by its id
 * ?id=String
 */
module.exports.getSourceCategoryItem = async (req, res) => {
	if (!req.query.id) {
		log.warn('id of the source category is not present', {});
		res.status(422).json({ status: 'id of the source category is not present' });
		return;
	}

	if (!isValidObjectId(req.query.id)) {
		log.warn('id is in wrong format', { id: req.query.id });
		res.status(422).json({ status: 'id is in wrong format' });
		return;
	}
	const id = req.query.id;
	const populateOptions = {
		path: 'mediaHubCategory',
		select: 'name label _id',
	};

	const sourceCategoryDoc = await SourceCategory.findById(id).populate(populateOptions);
	if (!sourceCategoryDoc) {
		log.warn('source category was not found', { id: req.query.id });
		res.status(404).json({ status: 'source category was not found' });
		return;
	}
	const sourceCategory = sourceCategoryDoc._doc;
	return res.status(200).json(sourceCategory);
};
