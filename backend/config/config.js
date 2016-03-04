var path = require('path'),
    rootPath = path.normalize(__dirname + '/..');

var config = {
    root: rootPath,
    //:qport: process.env['PORT'] || 6969,
    dbUrl: process.env['db_url'] || "mongodb://localhost/autostrada",
    dbUser: process.env['db_username'],
    dbPassword: process.env['db_password'],
}

module.exports = config