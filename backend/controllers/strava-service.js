"use strict"

var stravaClubs = require("../../data/strava_clubs").clubs;
var _ = require('lodash');
var async = require('async');
var strava = require('strava-v3');
var Activity = require('../models/activity');

function getClubs(callback) {
    strava.athlete.listClubs({}, function (err, clubs) {
        callback(err, clubs)
    })
}

exports.getNewStravaActivities = function () {

    var asyncTasks = [];

    getClubs(function (err, clubs) {
        if(err) {
            console.log("Error calling get clubs in strava", err)
            throw new Error(err)
        }
        clubs.forEach(function (club) {
            asyncTasks.push(function (callback) {
                getActivitiesForClub(club, callback)
            });
        })

        async.parallel(asyncTasks, function () {
            console.log("done calling strava, see you next time")
        });

    function getActivitiesForClub(club, callback) {
        console.log("Calling strava for club " + club.name + "(" + club.id + ")");
        strava.clubs.listActivities({id: club.id, per_page: 200}, function (err, payload) {
            if (err) {
                res.statusCode(500)
                throw new Error(err);
            }

            saveNewActivites(club, payload);
            callback();
        })
    }

    function saveNewActivites(club, activities) {
        activities.forEach(activity => {
            Activity.count({strava_club_id: club.id, 'strava_activity.id': activity.id}, function (err, count) {
                if (err) {
                    console.log(`Error checking if activity ${activity.id} already exists`);
                }
                if (count > 1) {
                    console.log(`This is weired, we have more than one document with strava id ${activity.id}`)
                }
                if (count === 0) {
                    Activity.createActivity(club, activity).save(function (err) {
                        if (err) {
                            console.log("Error saving activity", err)
                        }
                    })
                }

            })
        })
    }
})
}