var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var async = require('async');
var exec = require('child_process').exec;
var shellescape = require('shell-escape');

var Deplorator = function(port, config) {
	var self = this;

	this.app = express();
	this.port = port;
	this.config = config;

	this.app.use(morgan());
	this.app.use(bodyParser());
	this.app.post('/:id/deploy', function(req, res) {
		var name = req.param('id') + ':' + req.param('commit');

		if (!self.config[req.param('id')]) {
			return res.send(404, 'Invalid configuration: ' + req.param('id') + '.')
		}

		if (!req.param('commit')) {
			return res.send(400, 'Missing commit SHA!');
		}
		
		self.deploy(req.param('id'), req.param('commit'), function(err) {
			if (err) {
				res.send(400, 'An error ocurred deploying ' + name + ', check deploy log.');
			} else {
				res.send(200, 'Deployed ' + name + '.');
			}
		});
	});
};

Deplorator.prototype.deploy = function(name, commit, cb) {
	var self = this;
	var fullName = name + ':' + commit;
	var config = this.config[name];

	console.log('Deploy start:', fullName)

	async.series([
		function(cb) {
			if (!config.preDeploy) {
				return cb();
			}

			exec(config.preDeploy, {
				cwd: config.path
			}, cb);
		},
		function(cb) {
			exec(shellescape([ 'git', 'checkout', commit ]), {
				cwd: config.path
			}, cb);
		},
		function(cb) {
			exec(shellescape([ 'git', 'submodule', 'update' ]), {
				cwd: config.path
			}, cb);
		},
		function(cb) {
			if (!config.postDeploy) {
				return cb();
			}

			exec(config.postDeploy, {
				cwd: config.path
			}, cb);
		}
	], function(err) {
		if (err) {
			console.log('An error ocurred deploying ' + fullName + ':');
			console.log(err);
		}

		cb(err);
	});
};

Deplorator.prototype.run = function(cb) {
	this.app.listen(this.port, cb);
};

module.exports = Deplorator;

