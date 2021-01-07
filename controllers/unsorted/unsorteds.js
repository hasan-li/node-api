const log4js = require('log4js');
const each = require('async/each');

const Unsorted = require('../../models/Unsorted');
const SourceCategory = require('../../models/SourceCategory');
const isValidObjectId = require('./../common').isValidObjectId;
log4js.configure('./config/log4js.json');
const log = log4js.getLogger('controller-category-unsorteds');


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
module.exports.bindUnsortedToCategory = (req, res) => {
	// someone already responded
	if (res._header) { return; }

	if (!req.body || !Array.isArray(req.body)) {
		log.warn('request body with source is not present', {});
		res.status(422).json({status: 'request body with source is not present'});
		return;
	}

	const usortedsIdsQuery = [];

	// create query for finding by ids all usonrteds from body
	for (let i = 0; i < req.body.length; i++) {
		usortedsIdsQuery.push({
			_id: req.body[i].unsortedId
		});
	}

	Unsorted.find().or(usortedsIdsQuery).
		then((unsortedsDocs) => {
			const sourceCategories = [];
			each(unsortedsDocs, (doc, cb) => {
				const unsorted = doc._doc;
				const mediaHubCategory = req.body.find((element) =>
					element.unsortedId.toString() === unsorted._id.toString()
				);

				sourceCategories.push({
					name: unsorted.category,
					mediaHubCategory: mediaHubCategory.categoryId
				});

				doc.remove();
				cb();
			}, () => {
				SourceCategory.create(sourceCategories, async (err, srcCategories) => {
					if (err) {
						log.error('error occured while reaching db for unsorteds', {err});
						res.status(500).json('Error:' + err);
						return;
					}
					if (srcCategories.length === 0) {
						log.error('error occured while reaching db for unsorteds', {err: 'number of saved categories is 0'});
						res.status(500).json('Error: number of saved categories is 0');
						return;
					}
					const unsortedDocs = await Unsorted.find({});
					res.status(200).json(unsortedDocs);
				});
			});
		}).
		catch((error) => { log.error('error occured while reaching db for unsorteds', {error}); });
};

/**
 * GET
 * Returns all unsorteds docs
 */
module.exports.getAllUnsorteds = async (req, res) => {
	const unsortedDocs = await Unsorted.find({});
	res.status(200).json(unsortedDocs);
};


/**
 * GET
 * returns unsorted category by its id
 * ?id=String
 */
module.exports.getUnsortedCategoryItem = async (req, res) => {
	if (!req.query.id) {
		log.warn('id of the unsorted category is not present', {});
		res.status(422).json({status: 'id of the unsorted category is not present'});
		return;
	}

	if (!isValidObjectId(req.query.id)) {
		log.warn('id is in wrong format', {id: req.query.id});
		res.status(422).json({status: 'id is in wrong format'});
		return;
	}
	const id = req.query.id;

	const unsortedCategoryDoc = await Unsorted.findById(id);
	if (!unsortedCategoryDoc) {
		log.warn('unsorted category was not found', {id: req.query.id});
		res.status(404).json({status: 'unsorted category was not found'});
		return;
	}
	const unsortedCategory = unsortedCategoryDoc._doc;
	return res.status(200).json(unsortedCategory);
};


/**
 * GET
 * Remove unsorted category
 */
module.exports.remove = async (req, res) => {
	if (!req.query.id) {
		log.warn('unsorted category id is not present', {});
		res.status(422).json({status: 'unsorted category id is not present'});
		return;
	}
	const id = req.query.id;
	const query = await Unsorted.findOneAndDelete({_id: id});
	if (query._id.toString() === id.toString()) {
		res.status(200).json({status: 'ok', message: `unsorted category ${id} was removed`});
	} else {
		res.status(500).json({status: 'error', message: `error occured while removing unsorted category ${id}` });
	}
};
