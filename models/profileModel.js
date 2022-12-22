const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const profileSchema = new Schema({
  image: { type: String },
  name: { type: String, require: true },
  lastname: { type: String, require: true },
  weight: { type: Number, require: true },
  height: { type: Number, require: true },
  gender: { type: String, require: true, enum: ['Male', 'Female'] },
  dateBrith: { type: String, require: true },
  motivation: { type: String },
  calories: { type: Number },
  creator: { type: mongoose.Types.ObjectId, require: true, ref: 'User' },
});

module.exports = mongoose.model('Profile', profileSchema);
