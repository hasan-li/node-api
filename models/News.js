/* eslint-disable no-unused-vars */
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const Category = require('./Category');
const Source = require('./Source');

const newsSchema = mongoose.Schema({
	title: String,
	source: { type: mongoose.Schema.Types.ObjectId, ref: 'Source' },
	category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
	image: String,
	description: String,
	language: String,
	display: Boolean,
	link: String,
	author: String,
	clickNum: Number,
	primaryColor: String,
}, { timestamps: true, strict: false });

newsSchema.plugin(mongoosePaginate);
newsSchema.index({
	sourceCategory_id: 1,
	link: 1,
	sourceName: 1
});

module.exports = mongoose.model('News', newsSchema);
