var config = require("../config/config");
var Event = require('../models/event');
var _ = require('lodash');
var moment = require('moment');

exports.getVersion = function () {
    return function (req, res, next) {
        var resultHandler = function (err, events) {
            res.write(JSON.stringify(events));
            res.send();
        }

        var whereFilter = {};
        if (req.query.app) {
            whereFilter.application = new RegExp(req.query.app, "i");
        }
        if (req.query.env) {
            whereFilter.environment = new RegExp(req.query.env, "i");
        }
        if (req.query.since){
            var since = req.query.since;
            var numberFollowedByString = /(^[0-9]+)([a-zA-Z]+$)/;
            if (numberFollowedByString.test(since)){
                var matches = since.match(numberFollowedByString);
                var duration = matches[1];
                var durationType = matches[2];
                whereFilter.timestamp = { "$gte": moment().subtract(duration, durationType).format() }
            } else {
                res.statusCode = 400;
                throw new Error("Invalid format for parameter 'since'. Format should be <number><period>, e.g. '7days'. See http://momentjs.com/docs/#/manipulating for more info");
            }
        }

        Event.find(whereFilter).sort([['timestamp', 'descending']]).exec(resultHandler);
    }
}

exports.getCurrentVersions = function () {
    return function (req, res, next) {
        var resultHandler = function (err, events) {
            res.write(JSON.stringify(events));
            res.send();
        }

        Event.find({latest: true}).exec(resultHandler);
    }
}

exports.registerDeployment = function () {
    return function (req, res, next) {
        validateProperties(req.body, function (err) {
            res.statusCode = 400;
            throw new Error(err);
        });

        Event.update({
            environment: new RegExp(req.body.environment, "i"),
            application: new RegExp(req.body.application, "i"),
            latest: true
        }, {latest: false}, {multi: true}, function(err, numAffected, raw){

            if (err) {
                console.error(err);
            }

            var event = Event.createFromObject(req.body);

            event.save(function (err, event) {
                if (err) {
                    res.statusCode = 500;
                    throw new Error("Unable to save event", err);
                }
                res.send(200, JSON.stringify(event));
            });
        });
    }
}

function validateProperties(jsonObj, error) {
    var requiredKeys = ["application", "environment", "version", "deployedBy"];
    for (var idx in requiredKeys) {
        var key = requiredKeys[idx]
        if (!_.has(jsonObj, key)) {
            error("Unable to find required property " + key);
        }
    }
}
