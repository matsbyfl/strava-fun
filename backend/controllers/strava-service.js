"use strict"

var async = require('async');
var strava = require('strava-v3');
var Activity = require('../models/activity');

const STRAVA_API_MAX_ACTIVITIES = 200;

exports.getNewStravaActivities = function () {

    var asyncTasks = [];
    var total = 0;

    getClubs(function (clubs) {
        clubs.forEach(function (club) {
            asyncTasks.push(function (callback) {
                getActivitiesForClub(club, callback)
            });
        })

        async.parallel(asyncTasks, function () {
            console.log(`\nStrava sync complete, saved ${total} new activities`)
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

            saveNewActivites(club, payload, callback);
        })
    }

    function saveNewActivites(club, activities, callback) {

        var newActivities = 0;

        if (activities.length === 0) {
            console.log("No new activities for club " + club.name)
            callback();
        }

        async.each(activities, saveActivityIfNew, doStuff)

        function saveActivityIfNew(activity, cb) {
            activityExists(club, activity, function (alreadySaved) {
                if (!alreadySaved) {
                    newActivities = newActivities + 1;
                    Activity.createActivity(club, activity).save(function (err) {
                        if (err) {
                            console.log("Error saving activity", err)
                        }
                    })
                }
                cb()
            })
        }

        function doStuff() {
            console.log(`saved ${newActivities} new activities for ${club.name}(${club.id})`)
            total = total + newActivities
            callback();
        }
    }

    function activityExists(club, activity, callback) {
        Activity.count({strava_club_id: club.id, 'strava_activity.id': activity.id}, function (err, count) {
            if (err) {
                console.log(`Error checking if activity ${activity.id} already exists`, err);
                callback(true)
            }
            if (count === 1) {
                callback(true)
            }
            if (count === 0) {
                callback(false)
            }
        })
    }
}