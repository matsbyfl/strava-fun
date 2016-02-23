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


exports.health = function (req, res, next) {
    res.writeHead(200);
    res.end();
};

exports.clubs = function (req, res, next) {
    res.json(stravaClubs);
}

exports.activities = function (req, res, next) {
    var responseData = [];
    var asyncTasks = [];

    stravaClubs.filter(club => club.strava_id).forEach(function (club) {
        asyncTasks.push(function (callback) {
            getActivitiesForClub(club, callback)
        });
    });

    async.parallel(asyncTasks, function () {
        // use async to not call return response before db call and mapping is done
        Activity.find({}, (err, activities) => {
            if (err) {
                res.statusCode(500)
                throw new Error(err);
            }

            var byClub = _.groupBy(activities, act => {
                return act['strava_club_id']
            })

            _.keys(byClub).forEach(clubId => {
                var club = stravaClubs.filter(club => club.strava_id === clubId)
                //console.log("asa", ala.strava_activity)
                responseData.push({
                    club,
                    activities: mapActivities(byClub[clubId])
                });
                //byClub[clubId].forEach(ala => {

                //})
            })
        })

        eventhandler.emit("stravaApiCallsDone")

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
            console.log("returning", responseData.length)
            res.json(responseData);
        }
    });

    function getActivitiesForClub(club, callback) {
        console.log("Calling strava for club " + club.name + "(" + club.strava_id + ")");
        strava.clubs.listActivities({id: club.strava_id, per_page: 2}, function (err, payload) {
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
            Activity.count({strava_club_id: club.strava_id, 'strava_activity.id': activity.id}, function (err, count) {
                if(err) {
                    console.log(`Error checking if activity ${activity.id} already exists`);
                }
                if(count > 1 ) {
                    console.log(`This is weired, we have more than one document with strava id ${activity.id}`)
                }
                if(count === 0) {
                    Activity.createActivity(club, activity).save(function (err) {
                        if(err) {
                            console.log("Error saving activity", err)
                        }
                        else {
                            eventhandler.emit('newActivitySaved');
                        }
                    })
                }

            })
        })
    }
};


var mapActivities = function (stravaData) {

    return _.map(stravaData, function (activity) {
        //console.log("asfdsdsdfsdf", activity)
        var stravaActivity = activity.strava_activity
        console.log("saaaa", stravaActivity)
        return {
            athlete: {
                athlete_name: stravaActivity.athlete.firstname + " " + stravaActivity.athlete.lastname,
                athlete_sex: stravaActivity.athlete.sex,
                athlete_picture: stravaActivity.athlete.profile
            },
            type: stravaActivity.type,
            distance: stravaActivity.distance,
            moving_time: stravaActivity.moving_time,
            elapsed_time: stravaActivity.elapsed_time,
            total_elevation_gain: stravaActivity.total_elevation_gain,
            start_date_local: stravaActivity.start_date_local,
            kilojoules: stravaActivity.kilojoules,
            kudos_count: stravaActivity.kudos_count
        }
    })
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


class EventHandler extends EventEmitter {}

var newActivities = 0;

const eventhandler = new EventHandler();
eventhandler.on('newActivitySaved', () => {
    newActivities++;
});

eventhandler.on('stravaApiCallsDone', () => {
    console.log(`found ${newActivities} in strava, saved to local db`)
    newActivities = 0;
});
