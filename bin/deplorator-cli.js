var url = require('url');
var http = require('http');
var https = require('https');
var program = require('commander');

program.version('0.0.1');
program.option('[options] <configuration> <commit sha>');
program.option('-e, --endpoint [path]', 'deplorator endpoint', 'http://localhost:5000');

program.parse(process.argv);

if (program.args.length != 2) {
	help.help();
}

var payload = JSON.stringify({
	commit: program.args[1]
});

var uri = url.parse(program.endpoint + '/' + program.args[0] + '/deploy');
var req = (uri.protocol == 'https:' ? https : http).request({
	hostname: uri.hostname,
	port: uri.port,
	path: uri.path,
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'Content-Length': payload.length
	}
}, function(res) {
	var lastData = '';

	res.on('data', function(data) {
		lastData = data;
		process.stdout.write(data);
	});

	res.on('end', function() {
		if (lastData.toString().indexOf('ERR:') !== -1) {
			process.exit(1);
		} else {
			process.exit(res.statusCode == 200 ? 0 : 1);
		}
	});
});

req.write(payload);
req.end();

