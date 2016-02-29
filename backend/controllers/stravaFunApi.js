"use strict"

var config = require("../config/config");
var stravaClubs = require("../../data/strava_clubs").clubs;
var jsonToCSV = require('json-csv');
var _ = require('lodash');
var async = require('async');
var strava = require('strava-v3');
var moment = require('moment');
var Activity = require('../models/activity');
const EventEmitter = require('events');


function getClubs(res, callback) {
    strava.athlete.listClubs({}, function (err, clubs) {
        if (err) {
            res.statusCode(500);
            throw new Error(err);
        }
        callback(clubs)
    })
}

exports.health = function (req, res, next) {
    res.writeHead(200);
    res.end();
};

exports.clubs = function (req, res, next) {
    getClubs(res, function (clubs) {
        res.header("Content-Type", "application/json; charset=utf-8");
        res.json(clubs);
    })
}

exports.activities = function (req, res, next) {

    var asyncTasks = [];

    getClubs(res, function (clubs) {
        clubs.forEach(function (club) {
            asyncTasks.push(function (callback) {
                getActivitiesForClub(club, callback)
            });
        })

        async.parallel(asyncTasks, function () {
            var responseData = [];
            // use async to not call return response before db call and mapping is done
            console.log("done calling strava, now mongo time")
            Activity.find({}, (err, activities) => {
                if (err) {
                    res.statusCode(500)
                    throw new Error(err);
                }

                var activitiesByClub = _.groupBy(activities, act => {
                    return act['strava_club_id']
                })

                _.keys(activitiesByClub).forEach(clubId => {
                    var club = stravaClubs.filter(club => club.strava_club_id === clubId)

                    console.log(`returning ${activitiesByClub[clubId].length} activites for ${club.club_name}`)

                    responseData.push({
                        club: club.club_name,
                        activities: activitiesByClub[clubId]
                    });

                })

                if (req.query.csv === 'true') {
                    var a = responseData.map(function (club) {
                        return club.activities.map(function (activity) {
                            return {club: club.club, activity}
                        })
                    });
                    returnCSVPayload(res, _.flatten(a));
                }
                else {
                    res.header("Content-Type", "application/json; charset=utf-8");
                    res.json(responseData);
                }
            })
        })
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
};


var returnCSVPayload = function (res, activities) {
    var toExcelDateFormat = function (value) {
        if (value) {
            return moment(value).format("YYYY-MM-DD HH:mm:ss");
        }
    };

    var jsonToCsvMapping = {
        fields: [
            {name: "club.name", label: "club_name"},
            {name: "club.headcount", label: "club_headcount"},
            {name: "activity.athlete.athlete_name", label: "athlete_name"},
            {name: "activity.athlete.athlete_sex", label: "athlete_sex"},
            {name: "activity.athlete.athlete_picture", label: "athlete_picture"},
            {name: "activity.type", label: "activity_type"},
            {name: "activity.distance", label: "activity_distance"},
            {name: "activity.moving_time", label: "activity_moving_time"},
            {name: "activity.elapsed_time", label: "activity_elapsed_time"},
            {name: "activity.total_elevation_gain", label: "activity_totalt_elevation_gain"},
            {name: "activity.start_date_local", label: "activity_start_date", filter: toExcelDateFormat},
            {name: "activity.kilojoules", label: "activity_kilojoules"},
            {name: "activity.kudos_count", label: "activity_kudos_count"},
        ]
    };

    jsonToCSV.csvBuffered(activities, jsonToCsvMapping, function (err, csv) {
        if (err) {
            res.statusCode = 500;
            throw new Error(err);
        }
        res.header("Content-Type", "text/plain; charset=utf-8");
        res.write(csv);
        res.send();
    });
};

class EventHandler extends EventEmitter {
}

var newActivities = 0;

const eventhandler = new EventHandler();
eventhandler.on('newActivitySaved', () => {
    newActivities++;
});

