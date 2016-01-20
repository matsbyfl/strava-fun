var config = require("../config/config");
//var logger = require("../config/syslog");
//var Event = require('../models/event');
//var jsonToCSV = require('json-csv');
var _ = require('lodash');
var strava = require('strava-v3');


exports.activities = function (req, res, next) {
    strava.clubs.listActivities({id: 157332}, function (err, payload) {

        if (!err) {
            var output = [];
            console.log("got payload");
            payload.forEach(function (elem) {
                output.push({
                    name: elem.athlete.firstname + elem.athlete.lastname,
                    distance: elem.distance,
                    movingTime: elem.moving_time,
                    type: elem.type,
                    elevationGain: elem.total_elevation_gain
                })
            });

            //var totalDist = 0;
            //var totalTime = 0;
            ////var elevation = 0;

            var t = _.chain(output).groupBy(function (elem) {
                return elem.type;
            }).value();

            var keys = _.keys(t);

            //console.log(t)



            var pernaa = keys.map(function (key){
                var sum = summing(t[key]);
                //totalTime += sum.time;
                //elevation += sum.elevation;
                return {
                    type: key,
                    totalDist: sum.dist,
                    totalTime: sum.time,
                    totalElevation: sum.elevation
                }
            })

            console.log(payload.length)

            res.header("Content-Type", "application/json; charset=utf-8");
            res.json(pernaa);
        }
        else {
            console.log(err);
            res.header("Content-Type", "application/json; charset=utf-8");
            res.json(err);
        }
    });

    function summing(activities) {
        var dist = _.sum(activities, function (a) {
            return a.distance;
        });

        var time = _.sum(activities, function (a) {
            return a.movingTime;
        });

        var elevation = _.sum(activities, function (a) {
            return a.elevationGain;
        });

        return {dist, time, elevation}
    }
}




