const log4js = require('log4js');
const _ = require('lodash');
const each = require('async/each');

const Category = require('../../models/Category');
const SourceCategory = require('../../models/SourceCategory');
const News = require('../../models/News');
const User = require('../../models/User');
const isValidObjectId = require('./../common').isValidObjectId;

log4js.configure('./config/log4js.json');
const log = log4js.getLogger('controller-category-index');

/**
 * GET
 * Create new Category
 * REST params
 * name: name of the category (camelCase)
*/
module.exports.createNewCategory = (req, res) => {
	if (!req.query.name) {
		log.warn('name of category is not present', {});
		res.status(422).json({ status: 'name of category is not present' });
		return;
	}

	const name = req.query.name;
	const category = new Category({
		name
	});

	category.save((err, savedCategory) => {
		if (err) {
			log.error(err);
			res.status(500).json('Error:' + err);
		} else {
			log.info('new category created: ' + savedCategory.name);
			res.status(200).json('_id: ' + savedCategory._id);
		}
	});
};

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
module.exports.updateCategories = (req, res) => {
	// someone already responded
	if (res._header) { return; }

	if (!req.body || !Array.isArray(req.body)) {
		log.warn('request body with source is not present', {});
		res.status(422).json({ status: 'request body with source is not present' });
		return;
	}

	const categoriesIdsQuery = [];
	// create query for finding by ids all categories from body
	for (let i = 0; i < req.body.length; i++) {
		categoriesIdsQuery.push({
			_id: req.body[i]._id
		});
	}

	Category.find().or(categoriesIdsQuery).
		then((categoriesDocs) => {
			each(categoriesDocs, async (doc, cb) => {
				const category = doc._doc;
				const categoryWithNewValues = req.body.find((bodyCategory) =>
					bodyCategory._id.toString() === category._id.toString()
				);
				const updated = new Category(_.merge(category, categoryWithNewValues));
				const query = await Category.findOneAndUpdate({ _id: updated._id }, updated);
				if (!query) {
					log.error('error occured during updating category', { name: category.name, _id: category._id });
				}
				cb();
			}, async () => {
				const categories = await Category.find({}, '-news');
				res.status(200).json(categories);
			});
		});

};

/**
 * GET
 * Returns all categories
 */
module.exports.getAllCategories = async (req, res) => {
	const categories = await Category.find({}, '-news');
	res.status(200).json(categories);
};

/**
 * GET
 * Returns all categories with numbert of news for each
 */
module.exports.getNumberOfNewsPerCategory = async (req, res) => {
	const categories = [];
	const categoryDocs = Category.find({}, '-news').cursor();
	for (let category = await categoryDocs.next(); category !== null; category = await categoryDocs.next()) {
		const newsNumber = await News.find({ category: category._id }).exec();
		categories.push({
			_id: category._id,
			newsNumber: newsNumber.length
		});
	}
	res.status(200).json(categories);
};

/**
 * GET
 * Returns all categories which have at least 1 news
 */
module.exports.getAllNotEmptyCategories = async (req, res) => {
	const categories = [];
	const categoryDocs = Category.find({}, '-news').cursor();
	for (let category = await categoryDocs.next(); category !== null; category = await categoryDocs.next()) {
		const newsNumber = await News.find({ category: category._id }).limit(1).
			exec();
		if (newsNumber.length > 0) {
			categories.push(category);
		}
	}
	res.status(200).json(categories);
};

/**
 * POST
 * Remove category and replace all bindings in News and SourceCategories to another category
 * body:
 * {
 * 	categoryId,
 * 	newCategoryId,
 * };
 */
module.exports.removeCategory = async (req, res) => {
	// someone already responded
	if (res._header) { return; }

	if (!req.body) {
		log.warn('request body with source is not present', {});
		res.status(422).json({ status: 'request body with source is not present' });
		return;
	}

	if (!req.body.categoryId ||
		req.body.categoryId === '' ||
		!req.body.newCategoryId ||
		req.body.newCategoryId === ''
	) {
		log.warn('categoryId or newCategoryId is not present', {});
		res.status(422).json({ status: 'categoryId or newCategoryId is not present' });
		return;
	}

	if (req.body.categoryId === req.body.newCategoryId) {
		log.warn('categoryId or newCategoryId can not be same', {});
		res.status(422).json({ status: 'categoryId or newCategoryId can not be same' });
		return;
	}

	const categoryId = req.body.categoryId;
	const newCategoryId = req.body.newCategoryId;

	const newsDocs = News.find({ category: categoryId }).cursor();
	for (let newsItem = await newsDocs.next(); newsItem !== null; newsItem = await newsDocs.next()) {
		newsItem.category = newCategoryId;
		await newsItem.save();
	}
	const sourceCategoryDocs = SourceCategory.find({ mediaHubCategory: categoryId }).cursor();
	for (let sourceCategory = await sourceCategoryDocs.next(); sourceCategory !== null; sourceCategory = await sourceCategoryDocs.next()) {
		sourceCategory.mediaHubCategory = newCategoryId;
		await sourceCategory.save();
	}

	const removeResponse = await Category.findByIdAndDelete(categoryId);
	if (removeResponse) {
		res.status(200).json({ status: 'ok', message: `category ${categoryId} has been removed` });
	} else {
		res.status(200).json({ status: null, message: `category ${categoryId} has not been removed` });
	}
};

/**
 * POST
 * set user's categories
 * categories: [String] - list of categories
 */
module.exports.setCategories = async (req, res) => {
	if (res._header) { return; }

	const categories = req.body.categories;
	const deselected = req.body.deselected;
	if (!categories && !deselected) {
		res.status(422).json({ status: 'No categories and deselected categories selected' });
		return;
	}

	const user = await User.findById(req.user._id);
	if (!user) {
		res.status(400).json({ status: 'No user found' });
		return;
	}

	if (deselected && deselected.length > 0) {
		for (let i = 0; i < deselected.length; i++) {
			if (!deselected[i]) {
				continue;
			}
			if (user.categories.indexOf(deselected[i]) !== -1) {
				user.categories.splice(user.categories.indexOf(deselected[i]), 1);
			}
		}
	}

	if (categories && categories.length > 0) {
		for (let i = 0; i < categories.length; i++) {
			if (!categories[i]) {
				continue;
			}
			if (user.categories.indexOf(categories[i]) === -1) {
				user.categories.push(categories[i]);
			}
		}
	}

	await user.save();
	res.status(200).json({ status: 'ok' });
};

/**
 * GET
 * returns category by its id
 * ?id=String
 */
module.exports.getCategoryItem = async (req, res) => {
	if (!req.query.id) {
		log.warn('id of the category is not present', {});
		res.status(422).json({ status: 'id of the category is not present' });
		return;
	}

	if (!isValidObjectId(req.query.id)) {
		log.warn('id is in wrong format', { id: req.query.id });
		res.status(422).json({ status: 'id is in wrong format' });
		return;
	}
	const id = req.query.id;

	const categoryDoc = await Category.findById(id);
	if (!categoryDoc) {
		log.warn('category was not found', { id: req.query.id });
		res.status(404).json({ status: 'category was not found' });
		return;
	}
	const category = categoryDoc._doc;
	return res.status(200).json(category);
};
