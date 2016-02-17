var config = require("../config/config");
var stravaClubs = require("../../data/strava_clubs").clubs;
var jsonToCSV = require('json-csv');
var _ = require('lodash');
var async = require('async');
var strava = require('strava-v3');
var moment = require('moment');
var Activity = require('../models/activity');

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
        // here, get shit from DB
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
    });

    function saveNewActivites(club, activities) {
        activities.forEach(activity => {
            var a = new Activity({clubId: club.strava_id, clubName: club.name, stravaActivity: activity});
            console.log("aa", a)
            a.save(function (err, savedActivity) {
                if(err) {
                    console.log("Error saving activity", err)
                }
                else {
                    console.log("Saved activity for ", club.name, savedActivity)
                }

            })
        })

    }

    function getActivitiesForClub(club, callback) {
        console.log("Calling strava for club " + club.name + "(" + club.strava_id + ")");
        strava.clubs.listActivities({id: club.strava_id, per_page: 1}, function (err, payload) {
            if (err) {
                res.statusCode(500)
                throw new Error(err);
            }
            saveNewActivites(club, payload);
            responseData.push({
                club,
                activities: mapActivities(payload) //map when returning from DB
            });
            callback();
        })
    }
};


var mapActivities = function (stravaData) {
    return _.map(stravaData, function (activity) {
        return {
            athlete: {
                athlete_name: activity.athlete.firstname + " " + activity.athlete.lastname,
                athlete_sex: activity.athlete.sex,
                athlete_picture: activity.athlete.profile
            },
            type: activity.type,
            distance: activity.distance,
            moving_time: activity.moving_time,
            elapsed_time: activity.elapsed_time,
            total_elevation_gain: activity.total_elevation_gain,
            start_date_local: activity.start_date_local,
            kilojoules: activity.kilojoules,
            kudos_count: activity.kudos_count
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


