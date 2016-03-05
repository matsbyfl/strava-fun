module.exports = function(app) {
    var stravaFunApi = require('../controllers/stravaFunApi');

    app.get('/health', stravaFunApi.health)
    app.get('/api/v1/activities', stravaFunApi.activities)
}