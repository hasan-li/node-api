const log4js = require('log4js');
const mongoose = require('mongoose');

const News = require('../../models/News');
const User = require('../../models/User');
const SocialMediaArticle = require('../../models/SocialMediaArticle');

const languages = require('./../configs/commonData').languages;
const isValidObjectId = require('./../common').isValidObjectId;

log4js.configure('./config/log4js.json');
const log = log4js.getLogger('controller-news-services');

const setLanguageQuery = (langArr) => {
	if (langArr.length === 0) { return {}; }
	const query = { $or: [] };
	for (let i = 0; i < langArr.length; i++) {
		if (!(languages.indexOf(langArr[i]) > -1)) {
			log.error('unsupported language was sent', langArr[i]);
		}
		query.$or.push({ language: langArr[i] });
	}
	return query;
};

const setCategoryIdsQuery = (categoryIds) => {
	if (categoryIds.length === 0) { return {}; }
	const ids = categoryIds.reduce((result, idObj) => {
    const id = idObj.toString();
		if (isValidObjectId(id)) {
			result.push(mongoose.Types.ObjectId(id));
		}
		return result;
  }, []);
	if (ids.length === 0) { return {}; }
	return { category: { $in: ids } };
};

const getNewsAndSocialMediaFromDb = async (query, options, SMOptions, page, res) => {
	try {
		const news = await News.paginate(query, options);
		const smArticles = await SocialMediaArticle.paginate(query, SMOptions);
		const sortedArticles = [
			...news.docs,
			...smArticles.docs,
		];
		const result = {
			docs: sortedArticles,
			page,
			pages: news.pages >= smArticles.pages ? news.pages : smArticles.pages,
		};

		if (news.docs.length > 0 || smArticles.docs.length > 0) {
			res.status(200).json(result);
		}
	} catch (e) {
		log.error('error occured while getting articles from db', e);
	}
};

const getPaginationQuery = (langQuery, categoryIdsQuery) => ({
	...langQuery,
	...categoryIdsQuery,
	display: true
});

const getPaginationOptions = (page, limit) => ({
	page,
	limit,
	populate: [
		{
			path: 'category',
			select: 'name -_id',
		},
		{
			path: 'source',
			select: 'url officialName name -_id',
		},
	],
	sort: { createdAt: 'desc' },
	select: '-createdAt -display -__v -sourceName -sourceCategory_id',
});

const getSocialMediaPaginationOptions = (page, limit) => ({
	page,
	limit,
	populate: [
		{
			path: 'author',
			select: '-_id -createdAt -updatedAt -saveDataFunction -display -language -__v -source -baseColor -profileDescription',
			populate: {
				path: 'category',
				select: '-mainCategory -createdAt -updatedAt -__v',
			},
		},
		{
			path: 'source',
			select: '-language -_id -createdAt -updatedAt -__v -sourceUrl -sourceBaseColor',
		}
	],
	sort: { createdAt: 'desc' },
	select: '-createdAt -title',
});

const getNewsFromDb = (query, options, page, res) => {
	try {
		News.paginate(query, options, (err, result) => {
			if (err) {
				log.error('error occured while getting news', { error: err.toString() });
				res.status(404).json({
					status: 'error occured while getting news',
					error: err.toString(),
				});
				return;
			}
			if (!result) {
				res.status(500).json({ status: 'no news was found for page #' + page });
				return;
			}
			res.status(200).json(result);
		});
	} catch (e) {
		log.error('error occured while getting articles from db', e);
	}
};

const authUserPaginatedNews = async (userId, page, limit, onlyNews, res) => {
	const userDoc = await User.findById(userId);
	const user = userDoc._doc;
	const categoryIds = user.categories || [];
	const langQuery = setLanguageQuery(user.lang);
	const categoryIdsQuery = setCategoryIdsQuery(categoryIds);
	const options = getPaginationOptions(page, limit);
	const SMOptions = getSocialMediaPaginationOptions(page, limit);
	const query = getPaginationQuery(langQuery, categoryIdsQuery);

	if (onlyNews) {
		getNewsFromDb(query, options, page, res);
	} else {
		getNewsAndSocialMediaFromDb(query, options, SMOptions, page, res);
	}
};

const nonAuthUserPaginatedNews = (page, limit, cIds, langArr, onlyNews, res) => {
	const categoryIds = cIds || [];
	const langQuery = setLanguageQuery(langArr);
	const categoryIdsQuery = setCategoryIdsQuery(categoryIds);
	const options = getPaginationOptions(page, limit);
	const SMOptions = getSocialMediaPaginationOptions(page, limit);
	const query = getPaginationQuery(langQuery, categoryIdsQuery);

	if (onlyNews) {
		getNewsFromDb(query, options, page, res);
	} else {
		getNewsAndSocialMediaFromDb(query, options, SMOptions, page, res);
	}
};

module.exports = { authUserPaginatedNews, nonAuthUserPaginatedNews };