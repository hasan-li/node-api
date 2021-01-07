const express = require('express');
const router = express.Router();

const admin = require('./admin');
/**
* Gets all existing categories
*/
router.post(
	'/create/user',
	admin.createUser
);

router.post(
	'/login/user',
	admin.loginUser
);

module.exports.router = router;
