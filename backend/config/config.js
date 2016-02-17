var path = require('path'),
    rootPath = path.normalize(__dirname + '/..');

var config = {
    root: rootPath,
    //:qport: process.env['PORT'] || 6969,
    dbUrl: process.env['db_url'] || "mongodb://localhost/deploy_log",
    dbUser: process.env['db_username'] || "admin",
    dbPassword: process.env['db_password'] || "<hemmelig>",
}

module.exports = config