const mongoose = require('mongoose');

const Category = require('./Category');

const userSchema = mongoose.Schema({
	externalId: String,
	email: String,
	displayName: String,
	firstName: String,
	secondName: String,
	gender: String,
	externalLocale: String,
	provider: String,
	lang: [String],
	picture: String,
	categories: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: Category
		}
	]
}, { timestamps: true, strict: false });

module.exports = mongoose.model('User', userSchema);
