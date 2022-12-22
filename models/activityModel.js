const mongoose = require('mongoose');
const ACTIVITY_TYPE = require('../constant/activityType');

const Schema = mongoose.Schema;

const activitySchema = new Schema({
  title: {
    type: String,
    required: [true, 'A activity must have a name'],
  },
  date: {
    type: String,
    required: [true, 'A activity must have a date'],
  },
  timeStart: {
    type: String,
    required: [true, 'A activity must have a timeStart'],
  },
  timeEnd: {
    type: String,
    required: [true, 'A activity must have a timeEnd'],
  },
  sport: {
    type: String,
    enum: ACTIVITY_TYPE.SPORT,
    required: [true, 'A activity must have a sport'],
  },
  description: {
    type: String,
  },
  image: { type: String },
  creator: {
    type: mongoose.Types.ObjectId,
    require: true,
    ref: 'User',
  },
});

module.exports = mongoose.model('Activity', activitySchema);
