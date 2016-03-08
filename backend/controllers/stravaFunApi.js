"use strict"

var config = require("../config/config");
var jsonToCSV = require('json-csv');
var _ = require('lodash');
var Activity = require('../models/activity');
var flatten = require('flat')
var moment = require('moment')

exports.health = function (req, res, next) {
    res.writeHead(200);
    res.end();
};

exports.activities = function (req, res, next) {
    var predicate = {}

    if(req.query.last) {
        predicate = {'strava_activity.start_date_local': toTimePredicate(req.query.last)}
    } 

    Activity.find(predicate, (err, activities) => {
        if (err) {
            res.statusCode(500)
            throw new Error(err);
        }

        if (req.query.csv === 'true') {
            var flattened = activities.map( activity => {
                return flatten(activity.toJSON(), {delimiter: '_'})
            })

            returnCSVPayload(res, flattened)
        }
        else {
            res.header("Content-Type", "application/json; charset=utf-8");
            res.json(activities);
        }
    })
};

var toTimePredicate = function(momentValue){
    const timespanpattern = /(^[0-9]+)([a-zA-Z]+$)/

    if(timespanpattern.test(momentValue)) {
        var matches = momentValue.match(timespanpattern)
        var quantity = matches[1]
        var timeUnit = matches[2]
        return {"$gte": moment().subtract(quantity, timeUnit).format()}
    } else {
        throw new Error("Invalid format parameter for 'last'. Format should be <number><period>, e.g. 7days")
    }
}

var returnCSVPayload = function (res, activities) {

    var createCSVMapping = function (activities) {
        var createMappingObject = function(item) {
            var mappingObjectArray = []
            for( var key in item) {
                mappingObjectArray.push({name: key, label: key})
            }
            return mappingObjectArray
        }
        return {fields: createMappingObject(activities[0])}
    }

    jsonToCSV.csvBuffered(activities, createCSVMapping(activities), function (err, csv) {
        if (err) {
            res.statusCode = 500;
            throw new Error(err);
        }
        res.header("Content-Type", "text/plain; charset=utf-8");
        res.write(csv);
        res.send();
    });
};