const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const Profile = require('../models/profileModel');
const User = require('../models/userModel');

exports.getProfileById = async (req, res, next) => {
  const profileId = req.params.pid;

  let profile;
  try {
    profile = await Profile.findById(profileId);
  } catch (err) {
    const error = new HttpError(
      'Somthing went wrong, could not find a profile.',
      500
    );
    return next(error);
  }

  if (!profile) {
    const error = new HttpError(
      'Could not find a profile for the provided id',
      404
    );
    return next(error);
  }

  res.json({ profile: profile.toObject({ getters: true }) });
};

//======================================
exports.getProfileByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userWithProfile;
  try {
    userWithProfile = await User.findById(userId).populate('profile');
  } catch (err) {
    const error = new HttpError(
      'Fetching activities failed, please try again later',
      500
    );
    return next(error);
  }

  if (!userWithProfile || userWithProfile.profile.length === 0) {
    return next(new HttpError('Could not find a activity for the user id.'));
  }

  res.json({
    activities: userWithProfile.profile.map((pro) =>
      pro.toObject({ getters: true })
    ),
  });
};

//======================>End getProfileByUserId <======================//

exports.createProfile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const {
    name,
    lastname,
    weight,
    height,
    gender,
    dateBrith,
    motivation,
    calories,
    creator,
  } = req.body;

  const createdProfile = new Profile({
    image: req.file.path,
    name,
    lastname,
    weight,
    height,
    gender,
    dateBrith,
    motivation,
    calories,
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError('Creating place failed, please try again', 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find user for provided id', 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdProfile.save({ session: sess });
    user.profile.push(createdProfile);
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
    myProfile: createdProfile,
  });
};

// exports.createProfile = async (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return next(
//       new HttpError('Invalid inputs passed, please check your data.', 422)
//     );
//   }
//   const data = req.body;
//   const profile = await Profile.create(data);

//   let user;
//   try {
//     user = await User.findById(data.creator);
//   } catch (err) {
//     const error = new HttpError('Creating place failed, please try again', 500);
//     return next(error);
//   }

//   if (!user) {
//     const error = new HttpError('Could not find user for provided id', 404);
//     return next(error);
//   }

//   try {
//     const sess = await mongoose.startSession();
//     sess.startTransaction();
//     await profile.save({ session: sess });
//     user.profile.push(profile);
//     await user.save({ session: sess });
//     await sess.commitTransaction();
//   } catch (err) {
//     const error = new HttpError(
//       'Creating place failed, please try again.',
//       500
//     );
//     return next(error);
//   }
//   res.status(201).json({ myProfile: profile });
// };

//======================>End createProfile <======================//

exports.updateProfileById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, activity check your data.', 422)
    );
  }

  const {
    name,
    lastname,
    weight,
    height,
    gender,
    dateBrith,
    motivation,
    calories,
  } = req.body;
  const profileId = req.params.pid;

  let profile;
  try {
    profile = await Profile.findById(profileId);
  } catch (err) {
    const error = new HttpError(
      'Something went worng, dould not update profile.',
      500
    );
    return next(error);
  }

  if (profile.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      'You are not allowed to edit this activity',
      403
    );
    return next(error);
  }

  profile.name = name;
  profile.lastname = lastname;
  profile.weight = weight;
  profile.height = height;
  profile.gender = gender;
  profile.dateBrith = dateBrith;
  profile.motivation = motivation;
  profile.calories = calories;

  try {
    await profile.save();
  } catch (err) {
    const error = new HttpError(
      'Something went worng, could not update activity.',
      500
    );
    return next(error);
  }

  res.status(200).json({ profile: profile.toObject({ getters: true }) });
};

//======================>End updateProfileById <======================//
