module.exports = function(app) {
    var stravaFunApi = require('../controllers/stravaFunApi');

    app.get('/api/v1/activities', stravaFunApi.activities)
}