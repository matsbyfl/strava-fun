var mongoose = require('mongoose');
//var moment = require('moment');

//mongoose.Error.messages.general.required = "Property {PATH} is required in JSON request";

var activitySchema = new mongoose.Schema({ any: {} });

//eventSchema.set('toJSON', {
//    getters: true, transform: function (doc, ret, options) {
//        delete ret.__v;
//        delete ret._id;
//    }
//});

//activitySchema.statics.createFromObject = function (obj) {
//    return new Event({
//        application: obj.application,
//        environment: obj.environment,
//        version: obj.version || null,
//        deployer: obj.deployedBy,
//        deployed_timestamp: new Date(),
//        replaced_timestamp: null,
//        environmentClass: (obj.environmentClass) ? obj.environmentClass : getEnvClassFromEnv(obj.environment)
//    });
//}

module.exports = Activity = mongoose.model('Activity', activitySchema);