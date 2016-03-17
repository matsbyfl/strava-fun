var fs = require('fs')
var request = require('request')

var config = {}
const configPath = "data/strava_config";
const endpointBase = 'https://www.strava.com/api/v3/';

try {
    console.log("setting up strava api")
    config = JSON.parse(fs.readFileSync(configPath, {encoding: 'utf-8'}));
} catch (err) {
    console.info("no 'data/strava_config' file, continuing without...");
}

 if(process.env.STRAVA_ACCESS_TOKEN) {
    console.info("found strava access token as env var, using this")
    config.access_token = process.env.STRAVA_ACCESS_TOKEN;  
}

exports.getActivity = function(activityId, done) {
    getEndpoint(`activities/${activityId}`, done )
}

function getEndpoint (endpoint ,done) {
    if (typeof config.access_token === 'undefined' && !config.access_token) {
        return done({'msg': 'you must include an access_token'});
    }

    var url = endpointBase + endpoint
    var options = {
        url: url,
        json: true, 
        headers: {Authorization: 'Bearer ' + config.access_token}
    };

    request(options, function (err, response, payload) {
        if(err) {
            console.error('api call error', err);
        }
        done(err, response.statusCode, payload);
    });
};