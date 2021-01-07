/* eslint-disable no-unused-vars */
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const SocialMediaSource = require('./SocialMediaSource');

const socialMediaAuthorSchema = mongoose.Schema({
	name: String,
	nickName: String,
	profileDescription: String,
	profileImage: String,
	profileUrl: String,
	category: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
	source: { type: mongoose.Schema.Types.ObjectId, ref: 'SocialMediaSource' },
	baseColor: String,
	saveDataFunction: String,
	display: Boolean,
	language: [String],
}, { timestamps: true, strict: false });
socialMediaAuthorSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('SocialMediaAuthor', socialMediaAuthorSchema);
