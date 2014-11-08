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

require.extensions[".mustache"] = function(module, filename) {
	var template = hogan.compile(fs.readFileSync(filename).toString());
	module.exports = function(data) {
		return template.render(data);
	};
};

models.Course.prototype.refresh = function(cb) {
	achilles.Model.prototype.refresh.call(this, function(err) {
		if(err) {
			return cb(err);
		}
		models.User.get({where: {roles:{$in:["Course:get:" + this._id], $nin:["Course:put:" + this._id]}}, keys: "name"}, function(err, users) {
			if(err) {
				cb(err);
			}
			this.users2 = users;
			cb(null, this);
		}.bind(this));
	}.bind(this));
}

models.Course.prototype.toJSON = function(cb) {
	var y= achilles.Model.prototype.toJSON.call(this);
	console.log(this);
	y.users = this.users2;
	return y;
}

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
app.use("/scripts", browserify("./scripts", {
	transform:["browserify-mustache"]
}));

var tokens = {};

app.oauth = oauthserver({
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
});

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
app.use("/users", new achilles.Service(achilles.User));

app.set("port", process.env.PORT || 5000);

app.listen(app.get("port"), function () {
	console.log("Pandora listening at port " + app.get("port"));
});
