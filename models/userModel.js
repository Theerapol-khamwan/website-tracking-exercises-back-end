const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: { type: String, require: true, unique: true },
  password: { type: String, require: true, minlength: 6 },
  activities: [
    { type: mongoose.Types.ObjectId, require: true, ref: 'Activity' },
  ],
  profile: [{ type: mongoose.Types.ObjectId, require: true, ref: 'Profile' }],
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
