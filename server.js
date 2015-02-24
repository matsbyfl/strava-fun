var express = require('express');
var bodyParser = require('body-parser');
var dexter = require('morgan');
var config = require('./backend/config/config');
var mongoose = require('mongoose');
//var https = require('https');
var http = require('http');
var fs = require('fs');
var app = express();

var cors = function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return next();
}

app.use(cors);
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
        message: "internal error",
        error: err.message
    });
};

mongoose.connect(config.dbUrl);
console.log("MongoDB URL is ", config.dbUrl);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));

app.use(logError);
app.use(errorHandler);

app.use(express.static(__dirname + "/frontend/build"));

//var httpsServer = https.createServer({key: fs.readFileSync(config.tlsPrivateKey), cert: fs.readFileSync(config.tlsCert)}, app);
var httpServer = http.createServer(app);

httpServer.listen(config.port, function () {
    console.log("Ready for e-business on port " + config.port)
});
