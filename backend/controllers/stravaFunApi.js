"use strict"

var config = require("../config/config");
var jsonToCSV = require('json-csv');
var _ = require('lodash');
var Activity = require('../models/activity');
var metMapping = require("../config/metTable")
var flatten = require('flat')
var moment = require('moment')

exports.health = function (req, res, next) {
    res.writeHead(200);
    res.end();
};

exports.getUniqActivities = function(req, res, next) {
    getActivities(req.query, function(activities) {
         var uniqActivities = _.chain(activities).
         uniq(activity => {
            return activity.strava_activity.id
         }).map(activity => _.omit(activity, ["strava_club_id", "club_name"])).value();


         if (req.query.csv === 'true') {
              var flattened = uniqActivities.map( activity => {
                  return flatten(activity, {delimiter: '_'})
              })

            returnCSVPayload(res, flattened, req.query.csvfields)
          }
          else {
            res.header("Content-Type", "application/json; charset=utf-8");
            res.json(uniqActivities);
          }

    });
};

const getActivities = function(queryParams, callback) {
    var predicate = {}

    if(queryParams.last) {
        predicate = {'strava_activity.start_date_local': toTimePredicate(queryParams.last)}
    }

    Activity.find(predicate, function(err, activities) {
      if(err) {
           res.statusCode(500)
           throw new Error(err);
       }

       var metScoreEnrichedActivities = activities.map(activity => {
         var a = activity.toJSON()
         a.metscore = calculateMetScore(activity.strava_activity)
         return a
       })
       callback(metScoreEnrichedActivities)
    });
}

function calculateMetScore(activity) {
  const SECONDS_IN_HOUR = 3600
  const DEFAULT_MET_VALUE = 7
  const TWENTYFOUR_HOURS = SECONDS_IN_HOUR * 24

  const movingTimeInSeconds = activity.moving_time
  const type = activity.type.toLowerCase()
  const distance = activity.distance
  const kmh = Math.round((distance/movingTimeInSeconds)* 3.6 )

  let metScore

  if(movingTimeInSeconds > TWENTYFOUR_HOURS ) {
    console.log("Found activity with duration more than 24 hrs. No MET score for you! Activity id  " +  activity.id)
    metScore = 0
  }
  else if(!metMapping[type] || distance === 0) {
    metScore =  movingTimeInSeconds/SECONDS_IN_HOUR * DEFAULT_MET_VALUE
  }
  else {
    metScore = metMapping[type][kmh] * movingTimeInSeconds / SECONDS_IN_HOUR
  }

  metScore = round(metScore, 1)
  return metScore
}


function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

exports.activities = function (req, res, next) {
    var predicate = {}

    getActivities(req.query, function(activities) {
      if (req.query.csv === 'true') {
          var flattened = activities.map( activity => {
              return flatten(activity, {delimiter: '_'})
          })

          returnCSVPayload(res, flattened, req.query.csvfields)
      }
      else {
          res.header("Content-Type", "application/json; charset=utf-8");
          res.json(activities);
      }
    })
  }

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

var returnCSVPayload = function (res, activities, csvfields) {

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

    if(activities.length === 0) {
        res.header("Content-Type", "text/plain; charset=utf-8");
        res.statusCode = 404;
        res.send()
    }
    else {

        var filteredFields = activities;
        if(csvfields) {
            const fields = csvfields.split(',')

            filteredFields = activities.map(activity => {
                return _.pick(activity, fields)
            })
        }


        jsonToCSV.csvBuffered(filteredFields, createCSVMapping(filteredFields), function (err, csv) {
            if (err) {
                res.statusCode = 500;
                throw new Error(err);
            }
            res.header("Content-Type", "text/plain; charset=utf-8");
            res.write(csv);
            res.send();
        });
    }
};
