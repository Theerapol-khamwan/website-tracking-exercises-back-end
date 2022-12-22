const express = require('express');
const { check } = require('express-validator');

const activityConrtoller = require('../controllers/activityConrtoller');
const cheackAuth = require('../middleware/check-auth');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

// get Activity ทั้งหมดของ user id นั้น
router.get('/user/:uid', activityConrtoller.getActivityByUserId);

// get Activity ที่เลือก
router.get('/:aid', activityConrtoller.getActivityById);

router.use(cheackAuth);

// cerate new Activity
router.post('/', fileUpload.single('image'), activityConrtoller.createActivity);

// update Activity by ID
router.patch(
  '/:aid',
  [check('title').not().isEmpty(), check().isLength({ min: 5 })],
  activityConrtoller.updateActivityById
);

// delete activities by Id
router.delete('/:aid', activityConrtoller.deleteActivityById);

module.exports = router;
