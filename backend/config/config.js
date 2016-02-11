var path = require('path'),
    rootPath = path.normalize(__dirname + '/..');

var config = {
    root: rootPath,
    //:qport: process.env['PORT'] || 6969,
    //dbUrl: process.env['stravaFun_url'] || "mongodb://localhost/deploy_log",
    //dbUser: process.env['veraDb_username'] || "vera",
    //dbPassword: process.env['veraDb_password'] || "<hemmelig>",
}

module.exports = config