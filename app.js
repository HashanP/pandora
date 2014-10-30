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

var mongodb = require("achilles-mongodb");

var secrets = require("./config/secrets");

achilles.User.connection
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
/*app.use(cookieParser("fsfds"));
app.use(session({
 cookie : {
    maxAge: 3600000 // see below
  }
}));*/
app.use("/scripts", browserify("./scripts", {
	transform:["browserify-mustache"]
}));

var tokens = {};

app.oauth = oauthserver({
  model: {
		getAccessToken: function(bearerToken, cb) {
			console.log(bearerToken);
			console.log(tokens);
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

app.use("/api", new achilles.Service(models.Course));

app.set("port", process.env.PORT || 5000);

app.listen(app.get("port"), function () {
	console.log("Pandora listening at port " + app.get("port"));
});
