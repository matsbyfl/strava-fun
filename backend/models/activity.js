const mongoose = require('mongoose');
const _ = require('lodash');
const moment = require('moment')
const Schema = mongoose.Schema;

var activitySchema = new Schema({
    strava_club_id: Number,
    club_name: String,
    activity_date: String,
    strava_activity: Schema.Types.Mixed
});

activitySchema.set('toJSON', {
    getters: true, transform: function (doc, ret, options) {
        delete ret.__v;
        delete ret._id;
    }
});

var Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity