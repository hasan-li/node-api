const franc = require('franc-min');
const log4js = require('log4js');
const mongoose = require('mongoose');

log4js.configure('./config/log4js.json');
const log = log4js.getLogger('controller-common');

function cleanString(str) {
	try {
		let res = str.replace(/(\r\n|\n|\r)/gm, '');
		res = res.replace(/['"]+/g, '');
		res = res.replace(/<\/?[^>]+(>|$)/g, '');
		res = res.trim();
		// res = res.toLowerCase();
		return res;
	} catch (e) {
		log.error('error occured during cleaning string');
	}
}

function detectLanguage(title) {
	let az = ['azj', 'uzn', 'por', 'tur', 'jav', 'ita', 'mad', 'gax', 'hau', 'swl', 'lin', 'ceb', 'som', 'tgl', 'pol', 'ilo', 'swh', 'hrv', 'zlm', 'hnj', 'fuv'];
	let ru = ['rus', 'bul', 'srp', 'koi', 'ukr', 'bos', 'bel', 'kaz'];
	let en = ['nld', 'eng', 'ron', 'fra', 'spa', 'qug', 'swe', 'plt', 'zyb', 'deu', 'ind', 'sun', 'ckb', 'nya'];

	let code = franc(title);
	let lang = undefined;
	if (az.indexOf(code) > -1) {
		lang = 'az';
	}
	else if (ru.indexOf(code) > -1) {
		lang = 'ru';
	}
	else if (en.indexOf(code) > -1) {
		lang = 'en';
	}
	else {
		// DEBUG && console.log(code);
	}
	return lang;
}

function isValidObjectId(id) {
	const checkForHexRegExp = new RegExp('^[0-9a-fA-F]{24}$');
	if (typeof id === 'string') {
		return mongoose.Types.ObjectId.isValid(id) || id.length === 12 || id.length === 24 && checkForHexRegExp.test(id);
	}
	return false;
}

module.exports = { cleanString, detectLanguage, isValidObjectId };
