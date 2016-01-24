var config = require("../config/config");
var stravaClubs = require("../../data/strava_clubs").clubs;
//var logger = require("../config/syslog");
//var Event = require('../models/event');
//var jsonToCSV = require('json-csv');
var _ = require('lodash');
var async = require('async');
var strava = require('strava-v3');

var responseData = [];

exports.activities = function (req, res, next) {

    var asyncTasks = [];

    stravaClubs.forEach(function (club) {
        asyncTasks.push(function (callback) {
            getActivitiesForClub(club, callback)
        });
    });

    async.parallel(asyncTasks, function () {
        res.header("Content-Type", "application/json; charset=utf-8");
        res.json(responseData);
    });
}

var getActivitiesForClub = function (club, callback) {
    console.log("Calling strava for club " + club.name + "(" + club.id +  ")")
    strava.clubs.listActivities({id: club.id, per_page: 200}, function (err, payload) {
        if(err) {
            console.log("Err", err)
        }
        console.log(payload.length);

        responseData.push({club: club.name, activities: mapActivities(payload)})
        callback();
    })
}

var mapActivities = function(stravaData) {
    return _.map(stravaData, function(activity) {
        return {
            athlete_name: activity.athlete.firstname + " " + activity.athlete.lastname,
            athlete_sex: activity.athlete.sex,
            athlete_picture: activity.athlete.profile,
            avtivity_type: activity.type,
            activity_distance: activity.distance,
            activity_moving_time: activity.moving_time,
            activity_total_elevation_gain: activity.total_elevation_gain,
        }
    })
}

 //  strava.clubs.listActivities({id: 157332}, function (err, payload) {

    //    if (!err) {
    //        var output = [];
    //        payload.forEach(function (elem) {
    //            output.push({
    //                name: elem.athlete.firstname + elem.athlete.lastname,
    //                distance: elem.distance,
    //                movingTime: elem.moving_time,
    //                type: elem.type,
    //                elevationGain: elem.total_elevation_gain
    //            })
    //        });
    //
    //        //var totalDist = 0;
    //        //var totalTime = 0;
    //        ////var elevation = 0;
    //
    //        var t = _.chain(output).groupBy(function (elem) {
    //            return elem.type;
    //        }).value();
    //
    //        var keys = _.keys(t);
    //
    //        //console.log(t)
    //
    //
    //
    //        var pernaa = keys.map(function (key){
    //            var sum = summing(t[key]);
    //            //totalTime += sum.time;
    //            //elevation += sum.elevation;
    //            return {
    //                type: key,
    //                totalDist: sum.dist,
    //                totalTime: sum.time,
    //                totalElevation: sum.elevation
    //            }
    //        })
    //
    //        console.log(payload.length)
    //
    //        res.header("Content-Type", "application/json; charset=utf-8");
    //        res.json(pernaa);
    //    }
    //    else {
    //        console.log(err);
    //        res.header("Content-Type", "application/json; charset=utf-8");
    //        res.json(err);
    //    }
  //  });

    //function summing(activities) {
    //    var dist = _.sum(activities, function (a) {
    //        return a.distance;
    //    });
    //
    //    var time = _.sum(activities, function (a) {
    //        return a.movingTime;
    //    });
    //
    //    var elevation = _.sum(activities, function (a) {
    //        return a.elevationGain;
    //    });
    //
    //    return {dist, time, elevation}
    //}
//}




