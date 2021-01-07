const async = require('async');
const log4js = require('log4js');

const Source = require('../../models/Source');

log4js.configure('./config/log4js.json');
const log = log4js.getLogger('controller-source-index');


/**
 * POST
 * Adding source(s) to db
 * req.body should contain an array of source objects (defined in /models/Source)
 * @param {String} key
 */
module.exports.addSource = (req, res) => {
	if (res._header) { return; } // someone already responded

	if (!req.body || !Array.isArray(req.body)) {
		log.warn('request body with source is not present', {});
		res.status(422).json({status: 'request body with source is not present'});
		return;
	}

	async.each(req.body, (item, callback) => {
		if (!item.name || !item.url) {
			log.warn(item);
			callback('All objects must have name and url fields!');
			return;
		}
		let query = { name: item.name, url: item.url };
		let update = item;
		let options = { upsert: true, new: true, setDefaultsOnInsert: true };

		Source.findOneAndUpdate(query, update, options, (err, source) => {
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
		}

		log.info('Data was saved');
		res.status(200).json({status: 'Source(s) added'});
	});
};
