module.exports = function(app) {
    var stravaFunApi = require('../controllers/stravaFunApi');
    var autostradaValidations = require('../validations/autostradaValidations')
    var validate = require('express-validation')

    app.get('/health', stravaFunApi.health)
    app.get('/api/v1/activities', validate(autostradaValidations), stravaFunApi.activities)
}