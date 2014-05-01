deplorator
==========

Deplorator(deploy-creator) is a RESTful deploy manager meant to isolate your production servers from the CI server in order to improve security.

It listen on a RESTful HTTP interface and waits for the deploy command.
To deploy, it basically runs a pre-deploy command, runs `git fetch`, `git checkout <commit>`, `git submodule update` and then a post-deploy command.

Installation
============

To install deplorator, just use npm:
```
npm install -g deplorator
```

Server Usage
============

To start a server just use the following command:
```
deplorator -p <port> -f <config file>
```

Where 5000 is the port to listen to.

Configuration File
------------------

The configuration file is as simple as follow:
```json
{
	"<configuration-name>": {
		"path": "<local git repo path>",
		"preDeploy": "<command to be executed before the deploy>",
		"postDeploy": "<command to be executed after the deploy>"
	}
}
```

Example:
```json
{
	"production-api": {
		"path": "/home/deploy/production-api",
		"preDeploy": "pm2 stop production-api",
		"postDeploy": "npm install && npm update && pm2 start production-api"
	}
}
```

Client Usage
============

Deplorator has a utility to start a deploy, `deplorator-cli`, that can be used as follow:
```sh
deplorator -e <endpoint> <configuration> <commit>
```

For example:
```sh
deplorator -e http://localhost:5000 production-api 94fde93
```

Direct Access
-------------

You can use deplorator with curl if you want, like this:
```sh
curl -XPOST http://<endpoint>/<config>/deploy -d 'commit=<commit sha>'
```

For example:
```sh
curl -XPOST http://localhost:5000/production-api/deploy -d 'commit=94fde93
```

