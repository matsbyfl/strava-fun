var mongoose = require('mongoose');
var moment = require('moment');

mongoose.Error.messages.general.required = "Property {PATH} is required in JSON request";

var eventSchema = mongoose.Schema({
    application: {type: String, lowercase: true, trim: true, required: true},
    environment: {type: String, lowercase: true, trim: true, required: true},
    version: {type: String, trim: true, required: true},
    latest: Boolean,
    deployer: {type: String, trim: true, required: true},
    timestamp: Date
});

function isDeployedIsLast24Hrs(event) {
    return moment(event.timestamp).isAfter(moment().subtract(24, 'hours'));
}


function getEnvClassFromEnv(env) {
    firstChar = env.charAt(0);
    if(firstChar === 't' || firstChar === 'q' || firstChar === 'p') {
        return firstChar;
    }
    return 'u';
}

eventSchema.set('toJSON', {getters: true, transform: function(doc, ret, options) {
    delete ret.__v;
    delete ret._id;
    //ret.deployTime = ret.timestamp;
    ret.newDeployment = isDeployedIsLast24Hrs(ret); // TODO, ta tiden med og uten denne... Done, sparer ca 1 sekund....
    ret.timestamp = moment(ret.timestamp).format('DD-MM-YY HH:mm:ss');
    ret.envClass = getEnvClassFromEnv(ret.environment);
}});

eventSchema.statics.createFromObject = function(obj) {
    return new Event({
        application: obj.application,
        environment: obj.environment,
        version: obj.version,
        deployer: obj.deployedBy,
        timestamp: new Date(),
        latest: true
    });
}

module.exports = Event = mongoose.model('Event', eventSchema);