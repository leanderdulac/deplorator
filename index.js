var _ = require('lodash');
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var async = require('async');
var spawn = require('child_process').spawn;
var shellescape = require('shell-escape');

function shellExec(out, cmd, options, cb) {
	if (!cmd) {
		return cb();
	}

	if (!options) {
		options = {};
	}

	options.stdio = 'pipe';

	var child = spawn('sh', [ '-c', cmd ], options);

	child.on('close', function(code) {
		cb(code == 0 ? undefined : code);
	});

	child.stdout.on('data', function(data) {
		out.write(data);
	});

	child.stderr.on('data', function(data) {
		out.write(data);
	});

	return child;
}

var Deplorator = function(port, config) {
	var self = this;

	this.app = express();
	this.port = port;
	this.config = config;
	this.queueRunning = false;
	this.queue = [];

	this.app.use(morgan());
	this.app.use(bodyParser());
	this.app.post('/:id/deploy', function(req, res) {
		self._processDeploy(req, res);
	});
};

Deplorator.prototype._deploy = function(res, name, metadata, cb) {
	var self = this;
	var config = this.config[name];

	console.log('Deploy start:', name)

	var env = {
		'DEPL_METADATA_RAW_JSON': JSON.stringify(metadata)
	};

	for (var key in metadata) {
		env['DEPL_METADATA_' + key] = metadata[key];
	}

	async.series([
		function(cb) {
			shellExec(res, config.command, {
				cwd: config.path,
				env: _.merge({}, process.env, env)
			}, cb);
		}
	], function(err) {
		if (err) {
			console.log('An error ocurred deploying ' + name + ':');
			console.log(err);
		}

		console.log('Deploy end:', name);
		console.log('----------------------');

		cb(err);
	});
};

Deplorator.prototype.run = function(cb) {
	this.app.listen(this.port, cb);
};

Deplorator.prototype._processDeploy = function(req, res) {
	var self = this;
	var name = req.param('id');

	if (!this.config[req.param('id')]) {
		return res.send(404, 'Invalid configuration: ' + req.param('id') + '.\n')
	}

    res.writeHead(200, {
        'Content-Type': 'text/plain',
		'Transfer-Encoding': 'chunked'
    });

	this._deploy(res, req.param('id'), req.param('metadata'), function(err) {
		if (err) {
			res.write('\nERR: An error ocurred deploying ' + name + ', check deploy log.\n');
		} else {
			res.write('\nOK: Deployed ' + name + '.\n');
		}

		res.end();
	});
};

module.exports = Deplorator;

