// A Beautiful Example of the Craft of a Controller
var subject = require("./subject.web.js");
var mongoose = require("mongoose");
var Subject = mongoose.model("Subject");
var User = mongoose.model("User");

var index = function(req, res) {
    Subject.findById(req.param("subject"), function(err, doc) {
	if(err) {
	    res.error(err);
	} else {
	    res.render(subject, {subject: doc, full: req.query.full === "true"});
	}
    });
};

var publish = function(req, res) {
    var update = {
	$push: {
	    blog: {
		title: req.body.title,
		body: req.body.body,
		draft: req.query.drafts === "true"
	    }
	}
    };
    Subject.findByIdAndUpdate(req.param("subject"), update, function(err, doc) {
	if(err) {
	    res.error(err);
	} else {
	    res.render(subject, {subject: doc, full: req.query.full === "true"});
	}
    });
};

var get = function(req, res) {
    Subject.findById(req.param("subject"), {vocab_quizzes: true, blog:{$elemMatch:{_id: req.param("post")}}}, function(err, doc) {
	if(err) {
	    res.error(err);
	} else {
	    res.render(subject, {subject: doc, full: true})
	}
    });
};

export { index, publish, get };
