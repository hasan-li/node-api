const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const sourceSchema = mongoose.Schema({
	name: String,
	url: String,
	officialName: String,
	newsUrl: [{
		lang: String,
		url: String,
	}],
	encoding: String,
	logo: String,
	description: String,
	baseColor: String,
	display: Boolean,
	facebook: String,
	twitter: String,
	instagram: Number,
	googlePlus: Number,
	saveDataFunction: String,
	lang: [String],
}, { timestamps: true, strict: false });
sourceSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Source', sourceSchema);
