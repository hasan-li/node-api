const mongoose = require('mongoose');

const adSchema = mongoose.Schema({
	startDate: String,
	expirationDate: String,
	category: mongoose.Schema.Types.ObjectId,
	title: String,
	description: String,
	image: String,
	url: String,
}, { timestamps: true, strict: false });

module.exports = mongoose.model('Ad', adSchema);
