const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const Category = require('./Category');

const sourceCategorySchema = mongoose.Schema({
	name: String,
	mediaHubCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
}, { timestamps: true, strict: false });

sourceCategorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model('SourceCategory', sourceCategorySchema);
