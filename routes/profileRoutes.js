const express = require('express');

const profileConrtoller = require('../controllers/profileConrtoller');
const fileUpLoad = require('../middleware/file-upload');
const cheackAuth = require('../middleware/check-auth');

const router = express.Router();

// get profile by Id
router.get('/user/:uid', profileConrtoller.getProfileByUserId);

// get profile ที่เลือก
router.get('/:pid', profileConrtoller.getProfileById);

router.use(cheackAuth);

// cerate new profile
router.post('/', fileUpLoad.single('image'), profileConrtoller.createProfile);

// update profile by id
router.patch('/:pid', profileConrtoller.updateProfileById);

module.exports = router;
