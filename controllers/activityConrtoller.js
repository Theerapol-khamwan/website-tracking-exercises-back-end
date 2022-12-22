const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const Activity = require('../models/activityModel');
const User = require('../models/userModel');

exports.getActivityById = async (req, res, next) => {
  const activityId = req.params.aid;

  let activity;
  try {
    activity = await Activity.findById(activityId);
  } catch (err) {
    const error = new HttpError(
      'Somthing went wrong, could not find a activity.',
      500
    );
    return next(error);
  }

  if (!activity) {
    const error = new HttpError(
      'Could not find a activity for the provided id',
      404
    );
    return next(error);
  }
  // แปลง _id => id
  res.json({ activity: activity.toObject({ getters: true }) });
};

//======================>End getActivityById <======================//

exports.getActivityByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithActivity;
  try {
    userWithActivity = await User.findById(userId).populate('activities');
  } catch (err) {
    const error = new HttpError(
      'Fetching activities failed, please try again later',
      500
    );
    return next(error);
  }

  if (!userWithActivity || userWithActivity.activities.length === 0) {
    return next(new HttpError('Could not find a activity for the user id.'));
  }

  res.json({
    activities: userWithActivity.activities.map((act) =>
      act.toObject({ getters: true })
    ),
  });
};

//======================>End getActivityByUserId <======================//

exports.createActivity = async (req, res, next) => {
  // ดูว่ามี error ในการ validation ที่ตรวจพบตามการตั้งค่าของเราหรือไม่ !!!สำคัญ
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { title, date, timeStart, timeEnd, sport, description } = req.body;
  // const title = req.body.title

  const createdActivity = new Activity({
    title,
    date,
    timeStart,
    timeEnd,
    sport,
    description,
    image: req.file.path,
    creator: req.userData.userId,
  });

  // ตรวจสอบว่ามี user id ใน DB ที่ตรงกับ creator(user id) ที่มากจาก req.body หรือไม่
  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError('Creating place failed, please try again', 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find user for provided id', 404);
    return next(error);
  }

  // Transactions => ทำให้สามารถดำเนินการหลายรายการโดยแยกจากกัน และอาจเลิกทำการดำเนินการทั้งหมดหากหนึ่งในนั้นล้มเหลว
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdActivity.save({ session: sess });
    user.activities.push(createdActivity);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Creating place failed, please try again.',
      500
    );
    return next(error);
  }

  res.status(201).json({
    card: createdActivity,
  });
};

//======================>End cerateActivity <======================//

exports.updateActivityById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, activity check your data.', 422)
    );
  }

  const { title, date, timeStart, timeEnd, sport, description } = req.body;
  const activityId = req.params.aid;

  let activity;
  try {
    activity = await Activity.findById(activityId);
  } catch (err) {
    const error = new HttpError(
      'Something went worng, dould not update activity.',
      500
    );
    return next(error);
  }

  if (activity.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      'You are not allowed to edit this activity',
      403
    );
    return next(error);
  }

  activity.title = title;
  activity.date = date;
  activity.timeStart = timeStart;
  activity.timeEnd = timeEnd;
  activity.sport = sport;
  activity.description = description;

  try {
    await activity.save();
  } catch (err) {
    const error = new HttpError(
      'Something went worng, could not update activity.',
      500
    );
    return next(error);
  }

  res.status(200).json({ activity: activity.toObject({ getters: true }) });
};

//======================>End updateActivityById <======================//

exports.deleteActivityById = async (req, res, next) => {
  const activityId = req.params.aid;

  let activity;
  try {
    // ทำการ ref ไปยัง user ด้วยคำสั่ง .populate โดย parameter ค่าแรกที่ใส่เข้าไปจะเป็นฟิลด์ใน model ที่เราต้องการอ้างอิงถึง
    activity = await Activity.findById(activityId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Something went worng, could not delete place',
      500
    );
    return next(error);
  }

  //ตรวจสอบว่า activity นั้นมีอยู่จริงหรือไม่
  if (!activity) {
    const error = new HttpError('Could not find place for this id.', 400);
    return next(error);
  }

  if (activity.creator.id !== req.userData.userId) {
    const error = new HttpError(
      'You are not allowed to delete this activity',
      403
    );
    return next(error);
  }

  const imageActivity = activity.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await activity.remove({ session: sess });
    activity.creator.activities.pull(activity);
    await activity.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went worng, could not delete place',
      500
    );
    return next(error);
  }

  fs.unlink(imageActivity, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: 'Deleted activity 💥' });
};

//======================>End deleteActivityById <======================//
