"use strict"

var async = require('async');
var strava = require('strava-v3');
var Activity = require('../models/activity');
var _ = require('lodash')
var moment = require('moment')

const STRAVA_API_MAX_ACTIVITIES = 200;

// exports.checkDeletedActivities = function() {
//     console.log("Starting cleanup service for removing deleted strava activities")
//     Activity.find({}, function(err, activities) {
//         const MAX_API_CALLS = 400;
//         const activityIds = _.uniq(activities, activity => activity.strava_activity.id).map(activity => activity.strava_activity.id)
//         console.log("got " + activityIds.length + " activities. Devision " + activityIds.length / MAX_API_CALLS)
//         //console.log(activityIds)
//         const slicecount = Math.ceil(activityIds.length / MAX_API_CALLS)
//         console.log(`Found ${activityIds.length} uniq activities. Splitting into ${slicecount} to not blow up strava api limitations`)

//         var slices = []

//         for(let i = 0; i < slicecount; i++) {
//             const startSlice = MAX_API_CALLS * i
//             const endSlice = MAX_API_CALLS * i + MAX_API_CALLS
//             var sliced = _.slice(activityIds, startSlice, endSlice)
//             slices.push(sliced)
//         }
//         console.log("sliced the shit")
//         slices.forEach(a => console.log(a.length))

//         var fjes = slices[0][0]
//         console.log("fjes", fjes)
//         strava.activities.
//     })
// }

//function deleteFromMongoIfNotInStrava(activitiesId)

exports.getNewStravaActivities = function () {
    var asyncTasks = [];
    var activityCounter = 0;
    var stravaActivites = [];
    var updatedActivities = 0;

    getClubs(function (clubs) {
        clubs.forEach(function (club) {
            asyncTasks.push(function (callback) {
                getActivitiesForClub(club, callback)
            });
        })

        async.parallel(asyncTasks, function () {
            console.log(`Done calling Strava api got a totalt of ${activityCounter} activities`)
            removeFromMongo(saveStravaActivities)
        });
    })

    function getClubs(callback) {
        strava.athlete.listClubs({}, function (err, clubs) {
            if (err) {
                console.log("Error calling get clubs in strava", err)
                throw new Error(err)
            }
            callback(clubs)
        })
    }

    function getActivitiesForClub(club, callback) {
        console.log("Calling strava for club " + club.name + "(" + club.id + ")");
        strava.clubs.listActivities({id: club.id, per_page: STRAVA_API_MAX_ACTIVITIES}, function (err, payload) {
            if (err) {
                res.statusCode(500)
                throw new Error(err);
            }

            var act = payload.map(payloadElement => createActivity(club, payloadElement))
            stravaActivites.push(act)
            console.log(`Got ${payload.length} activities for ${club.name}`)
            activityCounter = activityCounter + payload.length
            callback()
        })
    }

    function createActivity(club, activity) {
        var pluckedActivity = _.omit(activity, ['start_latlng', 'end_latlng', 'map', 'start_latitude', 'start_longitude' ])

        return {
            strava_club_id: club.id,
            club_name: club.name,
            activity_date: moment(pluckedActivity.start_date_local).format('YYYY-MM-DD'),
            strava_activity: pluckedActivity
        }
    }

    function removeFromMongo(callback) {
        
        const uniqueActivityIds = _.chain(stravaActivites).flatten().map(stravaActivity => stravaActivity.strava_activity.id).uniq().value()
        console.log(`Trying to remove existing ${activityCounter} activities from Mongo`)

        Activity.remove({'strava_activity.id': {$in: uniqueActivityIds }}, function(err, removedCount) {
            if(err) {
                console.error("Error removing activities from mongo", err)
                return
            }
            updatedActivities = removedCount 
            console.info( "successfully removed ", removedCount)
            callback()
        })
    }

    function saveStravaActivities() {
        Activity.collection.insert(_.flatten(stravaActivites), (err, activities) => {
            if(err) {
                console.error("shit hit the fan when batch inserting activities", err)
                return 
            }
            console.info(`successfully saved ${activities.length} activities. Thats ${activities.length - updatedActivities} new since last time`)
        })
    }
}