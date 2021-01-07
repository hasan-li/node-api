/* eslint-disable no-unused-vars */
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const socialMediaSourceSchema = mongoose.Schema({
	display: Boolean,
	url: String,
	name: String,
	logo: String,
	description: String,
	baseColor: String,
	language: [String],
}, { timestamps: true, strict: false });
socialMediaSourceSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('SocialMediaSource', socialMediaSourceSchema);
