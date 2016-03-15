"use strict"

var async = require('async');
var strava = require('strava-v3');
var Activity = require('../models/activity');

const STRAVA_API_MAX_ACTIVITIES = 200;

exports.getNewStravaActivities = function () {

    var asyncTasks = [];
    var totalNew = 0;
    var totalUpdated = 0;

    getClubs(function (clubs) {
        clubs.forEach(function (club) {
            asyncTasks.push(function (callback) {
                getActivitiesForClub(club, callback)
            });
        })

        async.parallel(asyncTasks, function () {
            console.log(`\nStrava sync complete, ${totalNew} new  and ${totalUpdated} updated activities`)
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
        var updatedActivities = 0;

        if (activities.length === 0) {
            console.log("No activities for club " + club.name)
            callback();
        }

        async.each(activities, removeAndCreate, logSummary)

        function removeAndCreate(activity, cb) {
            Activity.remove({strava_club_id: club.id, 'strava_activity.id': activity.id}, function(err, removedCount) {
                if(err) {
                    console.log('Error when trying to remove activity ${activity.id}', activity.id, err)
                    cb();
                }
                
                if(removedCount > 0) {
                    updatedActivities++
                }
                else {
                    newActivities++
                }   
                
                Activity.createActivity(club, activity).save(function (err) {
                    if (err) {
                         console.log("Error saving new activity", err)
                    }
                    cb();
                })
            })
        }

        function logSummary() {
            console.log(`saved ${newActivities} new activities and updated ${updatedActivities} for ${club.name}(${club.id})`)
            totalNew = totalNew + newActivities
            totalUpdated = totalUpdated + updatedActivities
            callback();
        }
    }
}