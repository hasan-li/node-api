const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const categorySchema = mongoose.Schema({
	name: String,
	label: {
		az: String,
		ru: String,
		tr: String,
		en: String,
	},
	mainCategory: false
}, { timestamps: true, strict: false });
categorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Category', categorySchema);
