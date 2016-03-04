var express = require('express');
var bodyParser = require('body-parser');
var dexter = require('morgan');
var config = require('./backend/config/config');
var stravaService = require('./backend/controllers/strava-service')
var mongoose = require('mongoose');
var http = require('http');
var app = express();

const FIVE_MINUTES=600000

var runStravaService = function() {
    setInterval(stravaService.getNewStravaActivities, FIVE_MINUTES)
}

var cors = function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return next();
};

var noCache = function(req,res,next){
    res.header("Cache-Control", "no-cache, no-store, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", 0);
    return next();
};

app.use(cors);
app.use(noCache);
app.use(bodyParser());
app.use(dexter());

app.set('port', config.port);
require('./backend/config/routes')(app);

var logError = function (err, req, res, next) {
    console.log("Error: %s", err.message);
    return next(err);
}

var errorHandler = function (err, req, res, next) {
    res.send({
        status: res.statusCode,
        message: err.message || "internal error"
    });
};

//mongoose.connect(config.dbUrl);
//logger.log("Using MongoDB URL", config.dbUrl);

console.log(`mongo time ${config.dbUser}@${config.dbUrl}`)

var connectWithRetry = function() {
    return mongoose.connect(config.dbUrl, {user: config.dbUser, pass: config.dbPassword}, function(err) {
        if (err) {
            console.error('Failed to connect to mongo on startup - retrying in 5 sec', err);
            setTimeout(connectWithRetry, 5000);
        }
    });
};
connectWithRetry();

var db = mongoose.connection;

db.on('connected', function(){console.log('connected to', config.dbUrl)});

app.use(logError);
app.use(errorHandler);

//app.use(express.static(__dirname + "/frontend/build"));

//var httpsServer = https.createServer({key: fs.readFileSync(config.tlsPrivateKey), cert: fs.readFileSync(config.tlsCert)}, app);
var httpServer = http.createServer(app);

var port = process.env.NODE_PORT || 3000;
var host = process.env.NODE_IP || 'localhost';

httpServer.listen(port, host, function () {
    console.log(`Ready for monkey-business on with ${host}:${port} PID ${process.pid}`)
});

module.exports = app;
runStravaService();
