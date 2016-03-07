"use strict"

var config = require("../config/config");
var jsonToCSV = require('json-csv');
var _ = require('lodash');
var Activity = require('../models/activity');
var flatten = require('flat')

exports.health = function (req, res, next) {
    res.writeHead(200);
    res.end();
};

exports.activities = function (req, res, next) {
    Activity.find({}, (err, activities) => {
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