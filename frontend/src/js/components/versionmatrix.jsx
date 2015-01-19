var React = require('react');
var util = require('../../vera-parser')
var $ = require('jquery');
var MatrixRow = require('./matrixrow.jsx');


module.exports = VersionMatrix = React.createClass({
    getInitialState: function () {
        return {
            jsonData: [],
            headers: [],
            body: []
        }
    },

    updateMatrixData: function(headers, body) {
        this.setState({headers: headers, body: body})
    },

    componentDidMount: function () {
        $.getJSON('http://localhost:9080/cv').done(function (data) {
            this.state.jsonData = data;
            util.buildVersionMatrix(data, this.updateMatrixData);
        }.bind(this));
    },

    handleChange: function (e) {
            var applicationFilter = this.refs.applicationFilter.getDOMNode().value.toLowerCase();
            var environmentFilter = this.refs.environmentFilter.getDOMNode().value.toLowerCase();

            var isElementIn = function(filter, element, property){
                var filters = filter.split(",");
                for (var i=0; i<filters.length; i++){
                    if (element[property].toLowerCase().indexOf(filters[i].trim()) > -1){
                        return true;
                    }
                }
                return false;
            }

            var filteredJsonData = this.state.jsonData.filter(function(elem) {
                return isElementIn(applicationFilter, elem, "application");
            }).filter(function(elem) {
                return isElementIn(environmentFilter, elem, "environment");
            });

            util.buildVersionMatrix(filteredJsonData, this.updateMatrixData);
            e.preventDefault();
    },

    clear: function (e) {
        this.refs.applicationFilter.getDOMNode().value = '';
        this.refs.environmentFilter.getDOMNode().value = '';
        util.buildVersionMatrix(this.state.jsonData, this.updateMatrixData);
    },

    render: function () {
        var headers = this.state.headers;
        var body = this.state.body;
        return (
            <div className="container-fluid">
                <form id="myform" className="form-inline">
                    <div className="form-group">
                        <input ref="applicationFilter" type="text" className="form-control" placeholder="Applications filter..."></input>
                        <input ref="environmentFilter" type="text" className="form-control" placeholder="Environments filter..."></input>
                        <input type="submit" className="btn btn-default" onClick={this.handleChange} value="Apply" />
                        <input type="button" className="btn btn-danger" onClick={this.clear} value="Clear" />
                    </div>
                </form>

                <table className="table table-striped">
                    <tr>
                    {headers.map(function (header) {
                        return <th key={header}>{header.toUpperCase()}</th>
                    })}
                    </tr>
                    <tbody>
                    {body.map(function (row) {
                        return <MatrixRow key={row[0]} rowObject={row} />
                    })}
                    </tbody>
                </table>
            </div>
        )
    }
});