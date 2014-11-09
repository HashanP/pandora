var achilles = require("achilles");
var mongodb = require("achilles-mongodb");
var express = require("express");
var hogan = require("hogan.js");
var fs = require("fs");
var serveStatic = require("serve-static");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var models = require("./models");
var browserify = require("browserify-middleware");
var morgan = require("morgan");
var oauthserver = require('node-oauth2-server');
var compression = require('compression');
var xl = require("excel4node");

require.extensions[".mustache"] = function(module, filename) {
	var template = hogan.compile(fs.readFileSync(filename).toString());
	module.exports = function(data) {
		return template.render(data);
	};
};

var mongodb = require("achilles-mongodb");

var secrets = require("./config/secrets");

models.User.connection
= models.Course.connection
= new mongodb.Connection(secrets.db);

var app = new express();

app.use(compression());
app.use(morgan("short"));
app.use(serveStatic("./public", {
	extensions: ["html"]
}));
app.use(bodyParser.urlencoded({
	extended:true
}));
app.use(bodyParser.json());
app.use("/scripts/courses.js", browserify("./scripts/courses.js", {
	transform:["browserify-mustache"],
	precompile:true
}));

var tokens = {};

var oauthConfig = {
	model: {
		getAccessToken: function(bearerToken, cb) {
			if(!(bearerToken in tokens)) {
				cb(true);
			} else {
				cb(null, {
					expires:null,
					userId: tokens[bearerToken]
				})
			}
		},
		getClient: function(clientId, clientSecret, cb) {
			if(clientId === "000000") {
				cb(null, {clientId:clientId});
			} else {
				cb(true);
			}
		},
		grantTypeAllowed: function(clientId, grantType, cb) {
			if(clientId === "000000" && grantType === "password") {
				cb(null, {allowed:true});
			} else {
				cb(null, {allowed:false});
			}
		},
		saveAccessToken: function(accessToken, clientId, expires, user, cb) {
			tokens[accessToken] = user;
			cb();
		},
		getUser: function(username, password, cb) {
			achilles.User.login(username, password, function(err, user) {
				if(err) {
					return cb(err);
				} else if(!user) {
					return cb(err);
				} else {
					user.id = user._id;
					cb(null, user);
				}
			});
		}
	},
	grants: ['password'],
	debug: true,
	accessTokenLifetime:null
};

if(process.env.REDISCLOUD_URL) {
	var redis = require("redis-url");

	var client = redis.connect(process.env.REDISCLOUD_URL);

	oauthConfig.saveAccessToken = function(accessToken, clientId, expires, user, cb) {
		client.setex("accessToken:" + accessToken, 3600, user.toJSON(), cb);
	};

	oauthConfig.getAccessToken = function(bearerToken, cb) {
		client.get("accessToken:" + bearerToken, function(err, str) {
			if(!str) {
				cb(true);
			} else {
				cb(null, {
					expires:null,
					userId: JSON.parse(str)
				});
			}
		});
	};
}

app.oauth = oauthserver(oauthConfig);

app.get("/courses(*)", function(req, res) {
	res.sendfile("public/index.html");
});

app.all('/oauth/token', app.oauth.grant());
app.use(app.oauth.authorise());

app.use(function(req, res, next) {
	req.user = req.user.id;
	next();
});

app.get("/userinfo", function(req, res) {
	res.json(req.user.toJSON());
});

app.post("/userinfo/changePassword", function(req, res, next) {
	req.user.comparePassword(req.body.oldPassword, function(err, isMatch) {
		if(isMatch) {
			req.user.password = req.body.newPassword;
			req.user.save(function(err) {
				if(err) {
					return next(err);
				}
				res.end();
			});
		} else {
			next(new Error("Incorrect old password."));
		}
	});
});

app.use("/api", new achilles.Service(models.Course));

app.get("/api/:id/students", function(req, res, next) {
	models.User.get({where: {roles:{$in:["Course:get:" + req.params.id], $nin:["Course:put:" + req.params.id]}}, keys: "name"}, function(err, users) {
		if(err) {
			return next(err);
		}
		console.log(users);
		res.end(JSON.stringify(users.map(function(e) {return e.toJSON()})));
	}.bind(this));
});

app.get("/api/:id/students.xlsx", function(req, res, next) {
	models.User.get({where: {roles:{$in:["Course:get:" + req.params.id], $nin:["Course:put:" + req.params.id]}}, keys: "name"}, function(err, users) {
		if(err) {
			return next(err);
		}
		var wb = new xl.WorkBook();
		var header = wb.Style();
		header.Font.Bold();
		var ws = wb.WorkSheet("Students");
		ws.Cell(1,1).String("Username").Style(header);
		users.forEach(function(user, i) {
			ws.Cell(i + 2, 1).String(user.name);
		});
		wb.write("students.xlsx", res);
	}.bind(this));
});

app.use("/users", new achilles.Service(achilles.User));

app.set("port", process.env.PORT || 5000);

app.listen(app.get("port"), function () {
	console.log("Pandora listening at port " + app.get("port"));
});
