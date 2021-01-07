const mongoose = require('mongoose');

const adminUserSchema = mongoose.Schema({
	email: String,
	password: String,
}, { timestamps: true, strict: false });

module.exports = mongoose.model('AdminUser', adminUserSchema);
