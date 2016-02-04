var express = require('express');
var bodyParser = require('body-parser');
var dexter = require('morgan');
var config = require('./backend/config/config');
//var mongoose = require('mongoose');
var http = require('http');
var app = express();

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

//var db = mongoose.connection;

//db.on('error', console.error.bind(console, 'connection error:'));

app.use(logError);
app.use(errorHandler);

//app.use(express.static(__dirname + "/frontend/build"));

//var httpsServer = https.createServer({key: fs.readFileSync(config.tlsPrivateKey), cert: fs.readFileSync(config.tlsCert)}, app);
var httpServer = http.createServer(app);

var port = process.env.NODE_PORT || 3000;
var host = process.env.NODE_IP || 'localhost';

httpServer.listen(port, host, function () {
    console.log("Envvvv ", process.env)
    console.log("strava key " + process.env.STRAVA_ACCESS_TOKEN)
    console.log(`Ready for monkey-business on with ${host}:${port} PID ${process.pid}`)
});

module.exports = app;
