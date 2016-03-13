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

activitySchema.statics.createActivity = function (club, activity) {
    var pluckedActivity = _.omit(activity, ['start_latlng', 'end_latlng', 'map', 'start_latitude', 'start_longitude' ])

    return new Activity({
        strava_club_id: club.id,
        club_name: club.name,
        activity_date: moment(pluckedActivity.start_date_local).format('YYYY-MM-DD'),
        strava_activity: pluckedActivity
    })
}
var Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity