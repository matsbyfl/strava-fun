var React = require('react');
var $ = jQuery = require('jquery');
//var VersionMatrix = require('./frontend/src/js/components/versionmatrix.jsx');
var Router = require('react-router');
var RouteHandler = Router.RouteHandler;
var DefaultRoute = Router.DefaultRoute;
var Route = Router.Route;
var Link = Router.Link;
require('console-shim'); // IE9 FIX

var Autostrada = React.createClass({

    getInitialState: function () {
        return {}
    },


    componentDidMount: function () {

    },

    render: function () {

    }
})

//var routes = (
//    <Route handler={Vera}>
//        <DefaultRoute handler={VersionMatrix} />
//        <Route name="matrix" handler={VersionMatrix} />
//        <Route name="log" handler={DeployLog}/>
//    </Route>
//)
//
//Router.run(routes, function (Handler) {
//    React.render(<Handler />, document.getElementById('content'));
//})
