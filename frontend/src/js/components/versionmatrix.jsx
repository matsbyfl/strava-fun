var $ = jQuery = require('jquery');
var moment = require('moment');
var _ = require('lodash');
var React = require('react');
var Router = require('react-router');
var classString = require('react-classset');
var Link = Router.Link;
var util = require('../vera-parser');
var VersionTable = require('./versiontable.jsx');
var ToggleButtonGroup = require('./toggle-button-group.jsx');
var ToggleButton = require('./toggle-button.jsx');

module.exports = VersionMatrix = React.createClass({
    getInitialState: function () {
        var filters = {environmentClass: ['t', 'q', 'p']};

        filters.application = this.getQueryParam('apps');
        filters.environment = this.getQueryParam('envs');

        return {
            loaded: false,
            jsonData: [],
            filters: filters
        }
    },

    mixins: [Router.State],

    shouldComponentUpdate: function (nextProps, nextState) {
        return nextState.jsonData.length > 0;
    },

    componentDidMount: function () {
        $.getJSON('/api/v1/deploylog?onlyLatest=true&filterUndeployed=true').done(function (data) {
            var enrichedLogEvents = _.map(data, function (logEvent) {
                if (isDeployedLast24Hrs(logEvent)) {
                    var enrichedObject = _.clone(logEvent)
                    enrichedObject.newDeployment = true;
                    return enrichedObject;
                }
                return logEvent;
            });
            this.setState({jsonData: enrichedLogEvents});
        }.bind(this));

        var isDeployedLast24Hrs = function (logEvent) {
            return moment(logEvent.deployed_timestamp).isAfter(moment().subtract(24, 'hours'));
        };
    },

    getQueryParam: function (paramName) {
        var queryParam = this.getQuery()[paramName];
        return (queryParam) ? queryParam.split(',') : [];
    },

    componentWillUpdate: function () {
        var filters = this.state.filters;
        delete filters.application;
        delete filters.environment;

        filters.application = this.getQueryParam('apps');
        filters.environment = this.getQueryParam('envs');
    },

    componentDidUpdate: function () {
        if (!this.state.loaded) {
            this.setState({loaded: true});
        }
    },

    updateFilters: function (e) {
        var filters = {};
        var appFilter = this.refs.applicationFilter.getDOMNode().value.toLowerCase();
        var envFilter = this.refs.environmentFilter.getDOMNode().value.toLowerCase();
        if (appFilter) {
            filters.application = appFilter.split(',');
        }

        if (envFilter) {
            filters.environment = envFilter.split(',');
        }

        //if (this.refs.newDeployments.getDOMNode().checked) {
        //    filters.newDeployment = true;
        //}

        filters.environmentClass = this.refs.envClasses.getCheckedValues();
        this.setState({filters: filters});

        if (e.target.type === 'submit') { // prevent form submission, no need to call the server as everything happens client side
            e.preventDefault();
        }

        window.location.href = "#/matrix?envs=" + envFilter + "&apps=" + appFilter;
    },

    applyFilters: function () {

        _.mixin({
            'regexpMatchByValues': function (collection, property, filters) {
                if (!filters || filters.length === 0) {
                    return collection;
                }
                return _.filter(collection, function (item) {
                    var match = false;
                    for (var i = 0; i < filters.length; i++) {
                        var filterPattern = new RegExp('\\b' + filters[i].trim().replace(new RegExp('\\*', 'g'), '.*') + '\\b');
                        if (item[property].toLocaleLowerCase().search(filterPattern) > -1) {
                            match = true;
                        }
                    }
                    return match;
                })
            }
        });

        var filters = this.state.filters;
        //var applyFilter = function (inputData, filterString, filterProperty) {
        //    if (typeof filterString === 'boolean') {
        //        return inputData.filter(function (elem) {
        //            return elem[filterProperty] === true;
        //        });
        //
        //    }
        //}

        var filteredJsonData = this.state.jsonData;
        if (filters) {
            _.keys(filters).forEach(function (key) {
                filteredJsonData = _.regexpMatchByValues(filteredJsonData, key, filters[key]);
            })
        }
        return util.buildVersionMatrix(filteredJsonData, this.state.inverseTable);
    },

    clear: function () {
        this.refs.environmentFilter.getDOMNode().value = '';
        this.refs.applicationFilter.getDOMNode().value = '';
        var currentFilters = this.state.filters;
        delete currentFilters.application;
        delete currentFilters.environment;
        //this.setState({filters: currentFilters});
        window.location.href = "#/matrix";
    },

    inverseTable: function(clickedElement) {
        console.log("click");
        console.log(clickedElement);
        console.log(clickedElement.target.checked);

        this.setState({inverseTable: clickedElement.target.checked})

        //if(clickedElement.getValue()) {
        //
        //}
    },


    hasEnvClass: function (envClass) {
        return this.state.filters.environmentClass.indexOf(envClass) > -1
    },

    render: function () {
        var appFilter = this.state.filters.application;
        var envFilter = this.state.filters.environment;
        var filteredData = this.applyFilters();
        var headers = filteredData.header;
        var body = filteredData.body;

        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="panel panel-default">
                        <div className="panel-body">
                            <form className="form-inline">
                                <div>
                                    <div className="form-group">
                                        {this.createInputFilter('applications', 'applicationFilter', appFilter)}&nbsp;
                                        {this.createInputFilter('environments', 'environmentFilter', envFilter)}
                                        <button type="submit" className="btn btn-default btn-sm"
                                                onClick={this.updateFilters}>
                                            <i className="fa fa-filter"></i>
                                            &nbsp;
                                            apply
                                        </button>
                                        <button type="button" className="btn btn-danger btn-sm" onClick={this.clear}>
                                            <i className="fa fa-trash"></i>
                                            &nbsp;reset
                                        </button>
                                    </div>
                                    <div className="pull-right">
                                        <ToggleButtonGroup name="controls">
                                            <ToggleButton label='inverse' tooltip="swap environments and applications"
                                                          value="inverse" onChange={this.inverseTable}
                                                          checked={this.state.inverseTable}
                                                          iconClassName={["fa fa-level-down fa-flip-horizontal", "fa fa-level-up"]}/>
                                        </ToggleButtonGroup>
                                        <ToggleButtonGroup name="envClasses" ref="envClasses"
                                                           onChange={this.updateFilters}
                                                           value={this.state.filters.environmentClass}>
                                            <ToggleButton label='u' tooltip="show only development environments"
                                                          value="u"/>
                                            <ToggleButton label='t' tooltip="show onuply test environments" value="t"/>
                                            <ToggleButton label='q' tooltip="show only q environments" value="q"/>
                                            <ToggleButton label='p' tooltip="show only production" value="p"/>
                                        </ToggleButtonGroup>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <VersionTable key="tablekey" tableHeader={headers} tableBody={body}/>
                {<h3>
                    <i className={this.spinnerClasses()}></i>
                </h3>}
            </div >
        )
    },

    createInputFilter: function (labelText, inputId, defaultValue) {
        return (
            <div className="form-group">
                <div className="input-group">
                    <div className="input-group-addon">{labelText}</div>
                    <input ref={inputId} type="text" className="form-control input-sm"
                           defaultValue={defaultValue}></input>
                </div>
            </div>
        )
    },

    spinnerClasses: function () {
        return classString({
            'fa': true,
            'fa-spinner': true,
            'fa-spin': true,
            'hidden': this.state.loaded
        })
    }
});