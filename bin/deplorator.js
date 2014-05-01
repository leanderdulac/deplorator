#!/usr/bin/env node

var Deplorator = require('../index.js')
var program = require('commander');
var fs = require('fs');

program.version('0.0.1');
program.option('-p, --port [number]', 'port to start server', 5000);
program.option('-f, --config [path]', 'config file to use', 'config.json');

var config = JSON.parse(fs.readFileSync(program.config));
var instance = new Deplorator(program.port, config);

instance.run(function() {
	console.log('Deplorator is running on port ' + program.port + '!');
});

