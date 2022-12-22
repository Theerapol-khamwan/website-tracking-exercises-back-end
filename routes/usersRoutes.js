const express = require('express');
const { check } = require('express-validator');

const usersConrtoller = require('../controllers/usersConrtoller');

const router = express.Router();

// get users
router.get('/:uid', usersConrtoller.getUsers);

// signup
router.post(
  '/signup',
  [check('password').isLength({ min: 6 })],
  usersConrtoller.signup
);

// login
router.post('/login', usersConrtoller.login);

// update user by ID
router.patch('/:uid', usersConrtoller.updateUserById);

module.exports = router;
