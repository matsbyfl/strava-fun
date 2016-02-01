var config = require("../config/config");
var stravaClubs = require("../../data/strava_clubs").clubs;
//var logger = require("../config/syslog");
//var Event = require('../models/event');
var jsonToCSV = require('json-csv');
var _ = require('lodash');
var async = require('async');
var strava = require('strava-v3');
var moment = require('moment');

var responseData = [];

exports.health = function(req, res, next) {
    res.writeHead(200);
    res.end();
}

exports.activities = function (req, res, next) {

    var asyncTasks = [];

    stravaClubs.forEach(function (club) {
        asyncTasks.push(function (callback) {
            getActivitiesForClub(club, callback)
        });
    });

    async.parallel(asyncTasks, function () {

        if (req.query.csv === 'true') {
            var a = responseData.map(function(club){
                return club.activities.map(function(activity) {
                    return {club: club.club, activity: activity }
                })
            })
            returnCSVPayload(res, _.flatten(a));
        }
        else {
            res.header("Content-Type", "application/json; charset=utf-8");
            res.json(responseData);
        }
    });
}

var getActivitiesForClub = function (club, callback) {
    console.log("Calling strava for club " + club.name + "(" + club.id +  ")")
    strava.clubs.listActivities({id: club.id, per_page: 200}, function (err, payload) {
        if(err) {
            console.log("Err", err)
        }
        //console.log(payload.length);

        responseData.push({club: club.name, activities: mapActivities(payload)})
        callback();
    })
}

var mapActivities = function(stravaData) {
    return _.map(stravaData, function(activity) {
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
}

 
var returnCSVPayload = function (res, activities) {
    var toExcelDateFormat = function(value){
        if (value){
            return moment(value).format("YYYY-MM-DD HH:mm:ss");
        }
    };

    var jsonToCsvMapping = {
        fields: [
            {name: "club", label: "club_name"},
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
}


