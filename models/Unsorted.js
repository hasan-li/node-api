const mongoose = require('mongoose');

const unsortedSchema = mongoose.Schema({
	name: String,
	source: String
}, { timestamps: true, strict: false });

module.exports = mongoose.model('Unsorted', unsortedSchema);
