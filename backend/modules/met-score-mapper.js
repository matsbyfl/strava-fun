exports.metScoreForActivity = function (activity, done) {

}

// array to map average speed to met score. Array index correspons to average speed
const metMapping = {
    "ride": [0, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 3.50, 3.60, 3.70, 4.00, 4.00, 4.00, 4.00, 4.00, 6.80, 6.80, 6.80, 8.00, 8.00, 8.00, 8.00, 8.00, 10.00, 10.00, 10.00, 10.00, 12.00, 12.00, 12.00, 12.00, 12.00, 15.80, 16.20, 17.00, 17.53, 18.13, 18.73, 19.33, 19.93, 20.53, 21.13, 21.73, 22.33, 22.93, 23.53, 24.13, 24.73, 25.33, 25.93, 26.53, 27.13, 27.73, 28.33, 28.93, 29.53, 30.13, 30.73, 31.33, 31.93, 32.53, 33.13, 33.73, 34.33, 19.00, 19.00, 19.00, 19.00, 19.00, 19.00],
    "ebike": [0, 2.00, 2.00, 2.00, 2.00, 2.00, 2.00, 3.50, 3.50, 3.50, 3.50, 3.50, 3.50, 3.50, 3.50, 3.50, 3.50, 3.50, 3.50, 3.50, 5.00, 5.00, 5.00, 5.00, 5.00, 5.00, 10.00, 12.00, 12.00, 12.00, 12.00, 12.00, 15.80, 16.20, 17.00, 17.53, 18.13, 18.73, 19.33, 19.93, 20.53, 21.13, 21.73, 22.33, 22.93, 23.53, 24.13, 24.73, 25.33, 25.93, 26.53],
    "run": [0, 1.1, 1.35, 2.5, 3.65, 4.8, 5, 7, 8.3, 9.4, 10.55, 11.7, 12.85, 14, 15.15, 16.3, 17.45, 18.6, 19.75, 20.9, 22.05, 23.2, 24.35, 25.5, 26.65, 27.8, 28.95, 30.1, 31.25, 32.4, 33.55],
    "swim": [0, 5, 8.3, 10, 14, 16, 18],
    "walk": [0, 2, 2, 2, 2, 3.466666667, 5, 7, 8.3],
    "nordic ski": [0, 2, 2, 2, 6.5, 7, 9, 9, 9, 12.5, 12.5, 12.5, 12.5, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15],
    "workout": [6],
    "rock climbing": [5.8],
    "weight training": [6]
}

function calculateMetScore(activity) {

  var kmhForMps = Math.round((activity.strava_activity.distance/activity.strava_activity.moving_time)* 3.6 )
  var t = activity.strava_activity.distance/activity.strava_activity.moving_time

  const type = activity.strava_activity.type.toLowerCase()
console.log(type, kmhForMps)
  const metScore = metMapping[type][kmhForMps] * activity.strava_activity.moving_time / 3600
  console.log("Met: " + metScore)


  // calc weeknum

  /*
  get met score for kph as rounded integer
  met * moving time in seconds / 3600

  */
  console.log("Kmh for mps  " + kmhForMps + " mps " + t + " " + (7.292 * 3.6))
}
const ride = {
    "activity_date": "2016-07-11",
    "strava_activity": {
      "suffer_score": 26,
      "workout_type": 10,
      "has_kudoed": false,
      "total_photo_count": 0,
      "elev_low": 0.8,
      "elev_high": 84.8,
      "max_heartrate": 186,
      "average_heartrate": 139.9,
      "has_heartrate": true,
      "device_watts": false,
      "kilojoules": 500.5,
      "average_watts": 177.1,
      "max_speed": 14.4,
      "average_speed": 7.292,
      "gear_id": "b1384389",
      "flagged": false,
      "private": false,
      "manual": false,
      "commute": false,
      "trainer": false,
      "photo_count": 0,
      "athlete_count": 1,
      "comment_count": 2,
      "kudos_count": 9,
      "achievement_count": 3,
      "location_country": "Norway",
      "location_state": "Oslo",
      "location_city": "Oslo",
      "timezone": "(GMT+01:00) Europe/Oslo",
      "start_date_local": "2016-07-11T15:23:30Z",
      "start_date": "2016-07-11T13:23:30Z",
      "type": "Ride",
      "total_elevation_gain": 196,
      "elapsed_time": 2861,
      "moving_time": 2826,
      "distance": 20606.3,
      "name": "Syndeflod",
      "athlete": {
        "follower": null,
        "friend": "accepted",
        "profile": "https://dgalywyr863hv.cloudfront.net/pictures/athletes/436972/147847/1/large.jpg",
        "profile_medium": "https://dgalywyr863hv.cloudfront.net/pictures/athletes/436972/147847/1/medium.jpg",
        "badge_type_id": 1,
        "updated_at": "2016-05-04T19:38:33Z",
        "created_at": "2012-05-02T08:13:53Z",
        "premium": true,
        "sex": "M",
        "country": "Norge",
        "state": "Akershus",
        "city": "Rykkinn",
        "lastname": "Norås",
        "firstname": "Jørgen",
        "resource_state": 2,
        "username": "jnors",
        "id": 436972
      },
      "upload_id": 702995730,
      "external_id": "garmin_push_1251232803",
      "resource_state": 2,
      "id": 637431341
    },
    "id": "578522f8c488fb9b456a30d3"
  }

calculateMetScore(ride)
