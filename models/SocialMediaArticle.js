/* eslint-disable no-unused-vars */
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const SocialMediaAuthor = require('./SocialMediaAuthor');
const SocialMediaSource = require('./SocialMediaSource');

const socialMediaArticleSchema = mongoose.Schema({
	externalId: String,
	title: String,
	content: String,
	language: String,
	author: { type: mongoose.Schema.Types.ObjectId, ref: SocialMediaAuthor },
	source: { type: mongoose.Schema.Types.ObjectId, ref: SocialMediaSource },
	images: [String],
	display: Boolean,
	postUrl: String,
	clickNum: Number,
}, { timestamps: true, strict: false });
socialMediaArticleSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('SocialMediaArticle', socialMediaArticleSchema);
