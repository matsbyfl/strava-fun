const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var activitySchema = new Schema({
    strava_club_id: Number,
    club_name: String,
    strava_activity: Schema.Types.Mixed
});

activitySchema.set('toJSON', {
    getters: true, transform: function (doc, ret, options) {
        delete ret.__v;
        delete ret._id;
    }
});

activitySchema.statics.createActivity = function (club, activity) {
    return new Activity({
        strava_club_id: club.id,
        club_name: club.name,
        strava_activity: activity
    })
}

module.exports = Activity = mongoose.model('Activity', activitySchema);