const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const User = require('../models/userModel');

exports.getUsers = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    // ส่ง email, name กลับมา ยกเว้น password
    user = await User.findById(userId, '-password -activities -profile');
  } catch (err) {
    const error = new HttpError(
      'Fetching users failed, please try again later.',
      500
    );
    return next(error);
  }

  res.json({ user: user.toObject({ getters: true }) });
};

//===============================>End getUsers <==================================//

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { email, password } = req.body;

  // ตรวจสอบว่าสามารถหา user ที่มี email ที่ลงทะเบียนไปเเล้ว
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'User exists already,please login instead.',
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      'Could not create user, please try again.',
      500
    );
    return next(error);
  }

  const createdUser = new User({
    email,
    password: hashedPassword,
    profile: [],
    activities: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError('Signing up failed, please try again.', 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError('Signing up failed, please try again.', 500);
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

// exports.signup = async (req, res, next) => {
//   const errors = validationResult(req);
//   if (!errors.isEmpty()) {
//     return next(
//       new HttpError('Invalid inputs passed, please check your data.', 422)
//     );
//   }

//   const data = req.body;

//   // ตรวจสอบว่าสามารถหา user ที่มี email ที่ลงทะเบียนไปเเล้ว
//   let existingUser;
//   try {
//     existingUser = await User.findOne({ email: data.email });
//   } catch (err) {
//     const error = new HttpError(
//       'Signing up failed, please try again later.',
//       500
//     );
//     return next(error);
//   }

//   if (existingUser) {
//     const error = new HttpError(
//       'User exists already,please login instead.',
//       422
//     );
//     return next(error);
//   }

//   let newUser;
//   try {
//     newUser = await User.create(data);
//   } catch (err) {
//     const error = new HttpError('Signing up failed, please try again.', 500);
//     return next(error);
//   }

//   res.status(201).json({ user: newUser.toObject({ getters: true }) });
// };

//===============================>End signup <==================================//

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // ตรวจสอบว่าสามารถหา user ที่มี email ที่ลงทะเบียนไปเเล้วหรือไม่
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  // cheack ว่า email ถูกต้องไหม ?
  if (!existingUser) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      401
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      'Could not log you in, please check your credentials and try again.',
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      401
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError('Logging in failed, please try again.', 500);
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

//===============================>End login <==================================//

exports.updateUserById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, activity check your data.', 422)
    );
  }

  const { email, password } = req.body;
  const userId = req.params.uid;

  let existingUser;
  try {
    existingUser = await User.findById(userId);
  } catch (err) {
    const error = new HttpError(
      'Something went worng, dould not update account.',
      500
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      'Could not create user, please try again.',
      500
    );
    return next(error);
  }

  existingUser.email = email;
  existingUser.password = hashedPassword;

  try {
    await existingUser.save();
  } catch (err) {
    const error = new HttpError('Signing up failed, please try again.', 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError('Signing up failed, please try again.', 500);
    return next(error);
  }

  res
    .status(201)
    .json({ userId: existingUser.id, email: existingUser.email, token: token });
};
