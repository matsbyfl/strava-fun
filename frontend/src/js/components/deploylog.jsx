var React = require('react');
var $ = require('jquery');
var moment = require('moment');
var _ = require('lodash');
var Router = require('react-router');
var LogRow = require('./logrow.jsx');
var classString = require('react-classset');

module.exports = DeployLog = React.createClass({

    mixins: [Router.State],

    getInitialState: function () {
        return {
            items: [],
            loaded: false,
            itemRenderCount: 50,
            isPolling: false,
            filters: this.enrichFromObject(this.emptyFilters, this.getQuery())
        };
    },

    componentDidMount: function () {
        this.getInitialDataFromBackend().success(this.getEverything);
    },

    render: function () {
        var filteredEvents = this.state.items.filter(this.tableHeaderFilter).filter(this.inactiveVersionsIfEnabled);
        var eventsToRender = filteredEvents.slice(0, this.state.itemRenderCount);

        return (
            <div className="container">
                <h2>events
                    <small> {filteredEvents.length + "/" + this.state.items.length}
                        <i className={this.spinnerClasses()}></i>
                    </small>
                    <div className="pull-right btn-toolbar" data-toggle="buttons" role="group">
                        <button type="button"  className="btn btn-default btn-sm" onClick={this.clearFilters} >
                            <i className="fa fa-trash"></i>&nbsp;
                        clear</button>
                        <label className={this.currentToggleButtonClasses(this.state.filters.onlyLatest)}>
                            <input type="checkbox" autoComplete="off" onClick={this.toggleOnlyLatest} />
                            <i className="fa fa-asterisk"></i>&nbsp;
                        show only latest
                        </label>
                        <label className={this.currentToggleButtonClasses(this.state.isPolling)}>
                            <input type="checkbox" autoComplete="off" onClick={this.togglePolling} />
                            <i className={this.autoRefreshClasses()}></i>
                        &nbsp;
                        {this.autoRefreshBtnText()}
                        </label>
                    </div>
                </h2>

                <table className='table table-bordered table-striped'>
                    <tr>
                        <th>
                            <input id="application" type="text" className="form-control input-sm" placeholder="application" value={this.state.filters.application}  onChange={this.handleChange} />
                        </th>
                        <th>
                            <input id="environment" type="text" className="form-control input-sm" placeholder="environment" value={this.state.filters.environment}  onChange={this.handleChange} />
                        </th>
                        <th>
                            <input id="deployer" type="text" className="form-control input-sm" placeholder="deployer" value={this.state.filters.deployer}  onChange={this.handleChange} />
                        </th>
                        <th>
                            <input id="version" type="text" className="form-control input-sm" placeholder="version" value={this.state.filters.version}  onChange={this.handleChange} />
                        </th>
                        <th>
                            <input id="timestamp" type="text" className="form-control input-sm" placeholder="timestamp"  value={this.state.filters.timestamp}  onChange={this.handleChange} />
                        </th>
                    </tr>
                    <tbody>
                        {eventsToRender.map(function (elem) {
                            return <LogRow key={elem.id} event={elem} />
                        })}
                    </tbody>
                </table>
                <button type="button" className="btn btn-link" onClick={this.viewMoreResults}>View more results...</button>
            </div>
        )
    },

    emptyFilters: {
        application: '',
        environment: '',
        deployer: '',
        version: '',
        timestamp: '',
        onlyLatest: false
    },

    validBackendParams: ["application", "environment", "deployer", "version", "onlyLatest"],

    DEPLOYLOG_SERVICE: '/api/v1/deploylog',

    POLLING_INTERVAL_SECONDS: 90,

    tableHeaderFilter: function (elem) {
        return elem.application.toLowerCase().indexOf(this.state.filters.application.toLowerCase()) > -1
            && elem.environment.toLowerCase().indexOf(this.state.filters.environment.toLowerCase()) > -1
            && elem.deployer.toLowerCase().indexOf(this.state.filters.deployer.toLowerCase()) > -1
            && elem.version.toLowerCase().indexOf(this.state.filters.version.toLowerCase()) > -1
            && elem.deployed_timestamp.toString().toLowerCase().indexOf(this.state.filters.timestamp.toLowerCase()) > -1;
    },

    inactiveVersionsIfEnabled: function (elem) {
        if (!this.state.filters.onlyLatest) {
            return true;
        } else {
            return elem.replaced_timestamp === null;
        }
    },

    handleChange: function (e) {
        var filter = _.clone(this.state.filters, true);
        filter[e.target.id] = e.target.value;
        this.setState({filters: filter});
    },

    getInitialBackendParams: function () {
        var serialize = function (obj) {
            return '?' + Object.keys(obj).reduce(function (a, k) {
                    a.push(k + '=' + encodeURIComponent(obj[k]));
                    return a;
                }, []).join('&')
        };

        var extractFromObject = function (values, object) {
            return Object.keys(object).filter(function (val) {
                return values.indexOf(val) > -1;
            });
        };

        var urlContainsValidBackendParams = extractFromObject(this.validBackendParams, this.getQuery()).length > 0;
        if (urlContainsValidBackendParams) {
            var extractedValidParams = _.pick(this.getQuery(), this.validBackendParams);
            return serialize(extractedValidParams);
        } else {
            return '?last=1week';
        }
    },

    mapToViewFormat: function (data) {
        var toReadableDateFormat = function (eventItem) {
            eventItem.deployed_timestamp = moment(eventItem.deployed_timestamp).format("DD-MM-YY HH:mm:ss");
            return eventItem;
        }

        var nullVersionsToUndeployed = function (eventItem) {
            if (!eventItem.version) {
                eventItem.version = 'undeployed';
            }
            return eventItem;
        }

        return data.map(toReadableDateFormat).map(nullVersionsToUndeployed);
    },

    getInitialDataFromBackend: function () {
        return $.getJSON(this.DEPLOYLOG_SERVICE + this.getInitialBackendParams()).success(function (data) {
            this.setState({items: this.mapToViewFormat(data)})
        }.bind(this));
    },

    getEverything: function () {
        $.getJSON(this.DEPLOYLOG_SERVICE).done(function (data) {
            this.setState({
                items: this.mapToViewFormat(data),
                loaded: true
            })
        }.bind(this));
    },

    enrichFromObject: function (base, object) {
        var enrichedObject = {};
        Object.keys(base).forEach(function (key) {
            enrichedObject[key] = object[key] ? object[key] : '';
        });
        return enrichedObject;
    },

    viewMoreResults: function () {
        this.setState({itemRenderCount: this.state.itemRenderCount + 50})
    },

    clearFilters: function () {
        this.setState({filters: _.clone(this.emptyFilters)});
    },

    toggleOnlyLatest: function () {
        var filter = _.clone(this.state.filters, true);
        filter['onlyLatest'] = !this.state.filters.onlyLatest;
        this.setState({filters: filter});
    },

    togglePolling: function () {
        var disablePolling = function () {
            clearInterval(this.interval);
            this.setState({isPolling: false});
        }.bind(this)

        var enablePolling = function () {
            this.interval = setInterval(this.tick, 1000);
            this.setState({secondsToNextPoll: this.POLLING_INTERVAL_SECONDS, isPolling: true});
        }.bind(this)

        this.state.isPolling ? disablePolling() : enablePolling();
    },

    tick: function () {
        var secondsToNextPoll = this.state.secondsToNextPoll;
        this.setState({secondsToNextPoll: secondsToNextPoll - 1})
        if (secondsToNextPoll < 1) {
            this.setState({secondsToNextPoll: this.POLLING_INTERVAL_SECONDS, loaded: false});
            this.getEverything();
        }
    },

    autoRefreshBtnText: function () {
        if (this.state.isPolling) {
            var nextPoll = this.state.secondsToNextPoll
            if (this.state.secondsToNextPoll < 10) {
                nextPoll = '0' + nextPoll;
            }
            return 'refreshing in ' + nextPoll;
        }
        return 'auto refresh'
    },

    autoRefreshClasses: function () {
        return classString({
            'fa': true,
            'fa-refresh': true,
            'fa-spin': this.state.isPolling
        })
    },

    spinnerClasses: function () {
        return classString({
            'fa': true,
            'fa-spinner': true,
            'fa-fw': true,
            'fa-spin': true,
            'hidden': this.state.loaded
        })
    },

    currentToggleButtonClasses: function (isActive) {
        return classString({
            "btn": true,
            "btn-default": true,
            "btn-sm": true,
            "active": isActive
        })
    }
});