/**
	* @author Hashan Punchihewa
	* This is the only JavaScript file of Pandora.
	* Pandora is a Single Page Application (SPA).
	* Why?
	* This means that rather than rendering the whole navigation bar,
	* CSS files, etc. on every page load only the new data is loaded.
	* Moreover because of web cache, data is only requested if it needs
	* to be requested http://en.wikipedia.org/wiki/Web_cache.
	*/

var models = require("../models");
var achilles = require("achilles");
var page = require("page");
var util = require("util");
var Editor = require("./Editor");

/**
	* MathJax is a JavaScript library by the American Mathematical Society
	* that allows Mathematical equations to be rendered on HTML pages.
	* It is included before this JavaScript in `index.html`. The following
	* lines of code configure MathJax to the needs of Pandora.
	* Please see http://www.mathjax.org.
	*/
MathJax.Hub.Config({
	tex2jax: {
		displayMath: [],
		inlineMath: []
	},
	/**
	 	* Disables MathJax's ugly context menu which pops up by default if you
		* right click.
		*/
	showMathMenu:false,
	"HTML-CSS": { linebreaks: { automatic: true } },
         SVG: { linebreaks: { automatic: true } }
});

/**
	* When the page loads MathJax automatically scans the code for Mathematical
	* notation, however it doesn't when the page updates due to JavaScript by
	* default. The following code manually calls MathJax's update function on
	* the updated region.
	*/
var defaultRender = achilles.View.prototype.render;

achilles.View.prototype.render = function() {
	if(this.id) {
		this.can = {
			get: process.env.USER.can("Course", "get", this.id),
			post: process.env.USER.can("Course", "post", this.id),
			put: process.env.USER.can("Course", "put", this.id),
			del: process.env.USER.can("Course", "del", this.id)
		}
	}
	this.api_key = localStorage.getItem("access_token");
	defaultRender.call(this);
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.el]);
};

function ListView(el, data) {
	achilles.View.call(this, el);
	this.define("data", [models.Course]);
	this.define("grid", Boolean);
	this.data = data;
	this.grid = true;
	this.on("click .grid", function() {
		this.grid = true;
		this.render();
	});
	this.on("click .list", function() {
		this.grid = false;
		this.render();
	});
	this.on("change grid", this.render.bind(this));
	this.admin = process.env.USER.roles.indexOf("admin") !== -1;
}

util.inherits(ListView, achilles.View);

ListView.prototype.templateSync = require("../views/list.mustache");

function CreateView(el) {
	achilles.View.call(this, el);
	this.model = new models.Course();
	this.bind(".field-title", "title");
	this.bind(".field-icon", "icon");
	this.on("click .submit", this.submit.bind(this));
}

util.inherits(CreateView, achilles.View);

CreateView.prototype.submit = function(e) {
	this.model.icon = this.el.querySelector(".field-icon").value;
	e.preventDefault();
	this.error = null;
	this.success = null;
	this.model.save(function(err) {
		if(err) {
			this.error = err;
		} else {
			page("/");
		}
		this.render();
	}.bind(this));
};

CreateView.prototype.templateSync = require("../views/create.mustache");

function CourseView(el, options) {
	achilles.View.call(this, el);
	this.data = options.data;
	this.id = options.id;
	this[options.section] = true;
}

util.inherits(CourseView, achilles.View);

CourseView.prototype.templateSync = require("../views/course.mustache");

function BlogView(el, options) {
	achilles.View.call(this, el);
	this.data = options.data;
	this.id = options.id;
}

util.inherits(BlogView, achilles.View);

BlogView.prototype.templateSync = require("../views/blog.mustache");

function PostView(el, options) {
	achilles.View.call(this, el);
	this.data = options.data;
	this.id = options.id;

	this.on("click .del", this.del);
}

util.inherits(PostView, achilles.View);

PostView.prototype.templateSync = require("../views/post.mustache");

PostView.prototype.del = function() {
	this.data.del(function() {
		page("/courses/" + this.id + "/blog");
	}.bind(this));
};

function CreatePostView(el, options) {
	achilles.View.call(this, el);
	this.model = options.model;
	this.bind(".title", "title");
	this.delegate(".content", "content", new Editor());
	this.on("click .submit", this.submit.bind(this));
	this.id = options.id;
}

util.inherits(CreatePostView, achilles.View);

CreatePostView.prototype.submit = function(e) {
	e.preventDefault();
	this.error = false;
	if(!this.model.date) {
		this.model.date = new Date(Date.now());
	}
	if(!this.model.container) {
		var y = new models.Course();
		y._id = this.id;
		y.posts = [this.model];
	}
	this.model.save(function(err) {
		if(err) {
			this.error = err;
		}
		page("/courses/" + this.id + "/blog");
	}.bind(this));
};

CreatePostView.prototype.templateSync = require("../views/formPost.mustache");

function ListQuizView(el, options) {
	achilles.View.call(this, el, options);
	this.title = options.title;
	this.data = options.data;
	this.section = options.section;
	this.id = options.id;
}

util.inherits(ListQuizView, achilles.View);

ListQuizView.prototype.templateSync = require("../views/listQuiz.mustache");

function VocabQuestion() {
	achilles.View.call(this, document.createElement("tr"));
	this.bind(".question", "question");
	this.bind(".answer", "answer");
	this.on("click .remove", this.remove.bind(this));
}

util.inherits(VocabQuestion, achilles.View);

VocabQuestion.prototype.templateSync = require("../views/vocabQuestion.mustache");

function CreateVocabQuizView(el, options) {
	achilles.View.call(this, el);
	this.id = options.id;
	this.model = options.model;
	this.bind(".title", "title");
	this.on("click .create-question", this.addQuestion.bind(this));
	this.on("click .submit", this.submit.bind(this));

	this.delegate(".questions", "questions", new achilles.Collection(VocabQuestion));
}

util.inherits(CreateVocabQuizView, achilles.View);

CreateVocabQuizView.prototype.addQuestion = function() {
	this.model.questions.push(new models.VocabQuestion());
};

CreateVocabQuizView.prototype.templateSync = require("../views/formVocabQuiz.mustache");

CreateVocabQuizView.prototype.submit = function() {
	if(!this.model.container) {
		var nova = new models.Course();
		nova._id = this.id;
		nova.vocabQuizzes = [this.model];
	}
	this.model.save(function(err) {
		if(err) {
			throw err;
		}
		page("/courses/" + this.id + "/vocab_quizzes");
	}.bind(this));
};

function VocabQuiz(el, options) {
	achilles.View.call(this, el);
	this.data = options.data;
	this.id = options.id;
	this.on("keyup input", this.changeInput.bind(this));
	this.on("click .reset", this.reset.bind(this));
	this.on("click .answers", this.revealAnswers.bind(this));
	this.on("click .del", this.del.bind(this));
}

util.inherits(VocabQuiz, achilles.View);

VocabQuiz.prototype.templateSync = require("../views/vocabQuiz.mustache");

VocabQuiz.prototype.del = function() {
	this.data.del(function() {
		page("/courses/" + this.id + "/vocab_quizzes");
	}.bind(this));
};

VocabQuiz.prototype.changeInput = function(e) {
	if(e.target.dataset.answer.toLowerCase().split(",").indexOf(e.target.value.toLowerCase()) !== -1) {
		e.target.classList.add("correct");
		e.target.classList.remove("incorrect");
		e.target.blur();
		if(e.target.nextSibling && e.target.nextSibling.nextSibling) {
			e.target.nextElementSibling.nextElementSibling.focus();
		}
	} else if(e.target.value !== "") {
		e.target.classList.add("incorrect");
		e.target.classList.remove("correct");
	}
};

VocabQuiz.prototype.revealAnswers = function() {
		Array.prototype.slice.call(this.el.querySelectorAll("input")).forEach(function(el) {
			if(!el.classList.contains("correct")) {
				el.classList.add("incorrect");
			}
			el.value = el.dataset.answer;
			el.readOnly = true;
		});
};

VocabQuiz.prototype.reset = function() {
		Array.prototype.slice.call(this.el.querySelectorAll("input")).forEach(function(el) {
			el.value = "";
			el.classList.remove("correct");
			el.classList.remove("incorrect");
			el.readOnly = false;
		});
};

function Option(el) {
	achilles.View.call(this, document.createElement("div"));
	this.bind(".title", "title");
	this.bind(".correct", "correct");
	this.on("click .remove", this.remove.bind(this));
}

util.inherits(Option, achilles.View);

Option.prototype.templateSync = require("../views/optionForm.mustache")

function Question(el, options) {
		achilles.View.call(this, el);
		this.model = options.model;

		this.bind(".answer_type", "answer_type");
		this.bind(".answer_text", "answer_text");
		this.bind(".answer_number", "answer_number");
		this.model.on("change:answer_type", this.render.bind(this));
		this.on("click .add-option", this.addOption.bind(this));
		this.on("click .remove", this.remove.bind(this));
		this.delegate(".content", "content", new Editor());
		this.delegate(".options", "options", new achilles.Collection(Option));

		this.model.on("change:answer_type", function() {
			this.answer_text = null;
			this.answer_number = null;

			if(this.answer_type !== undefined && this.answer_type !== "radio" || this.answer_type !== "checkbox") {
				this.options = [];
			}
		});
}

util.inherits(Question, achilles.View);

Question.prototype.templateSync = require("../views/questionForm.mustache");

Question.prototype.addOption = function() {
		this.model.options.push(new models.Option());
};

function CreateQuiz(el, options) {
	achilles.View.call(this, el);
	this.model = options.model;
	this.id = options.id;
	this.currentQuestionIndex = 0;

	Object.defineProperty(this, "currentQuestion", {
		get: function() {
			if(!this.model.questions) {
					return null;
			} else if(this.currentQuestionIndex > this.model.questions.length-1) {
				return this.model.questions[0];
			} else {
				return this.model.questions[this.currentQuestionIndex];
			}
		}
	});

	this.bind(".title", "title");
	this.model.on("remove:questions", this.render.bind(this));
	this.on("click .submit", this.submit.bind(this));
	this.on("click .question", this.showQuestion.bind(this));
	this.on("click .add-question", this.addQuestion.bind(this));
	this.model.on("push:questions", this.render.bind(this));
}

util.inherits(CreateQuiz, achilles.View);

CreateQuiz.prototype.showQuestion = function(e) {
	this.currentQuestionIndex = e.target.dataset.index;
	this.render();
};

CreateQuiz.prototype.render = function() {
	achilles.View.prototype.render.call(this);
	if(this.currentQuestion) {
		new Question(this.el.querySelector(".current_question"), {model: this.currentQuestion});
		this.el.querySelector(".button-" + this.currentQuestion.index).classList.add("active");
	}
};

CreateQuiz.prototype.templateSync = require("../views/formQuiz.mustache")

CreateQuiz.prototype.addQuestion = function() {
	this.currentQuestionIndex = this.model.questions.length;
	this.model.questions.push(new models.Question());
};

CreateQuiz.prototype.submit = function() {
	this.model.save(function(err) {
		if(err) {
			throw err;
		}
		page("/courses/" + this.id + "/quizzes");
	}.bind(this));
};

function QuizDetails(el, options) {
	achilles.View.call(this, el);

	this.on("click .del", this.del.bind(this));
	this.id = options.id;
	this.model = options.model;
	this.myAttempts = this.model.attempts.filter(function(attempt) {
		return attempt.user === process.env.USER._id;
	});
}

util.inherits(QuizDetails, achilles.View);

QuizDetails.prototype.templateSync = require("../views/quizDetails.mustache");

QuizDetails.prototype.del = function() {
	this.model.del(function(err) {
		if(err) {
			throw err;
		}
		page("/courses/" + this.id + "/quizzes");
	}.bind(this));
}

function OptionAttempt() {
	achilles.View.call(this, document.createElement("div"));

	this.bind(".correct", "correct");
}

util.inherits(OptionAttempt, achilles.View);

OptionAttempt.prototype.templateSync = require("../views/option.mustache");

function QuestionAttempt() {
	achilles.View.call(this, document.createElement("div"));
	this.define("model", models.QuestionAttempt);
	this.bind(".answer_text", "answer_text");
	this.bind(".answer_number", "answer_number");
	this.delegate(".options", "options", new achilles.Collection(OptionAttempt));
}

util.inherits(QuestionAttempt, achilles.View);

QuestionAttempt.prototype.templateSync = require("../views/question.mustache");

function QuizAttempt(el, options) {
	achilles.View.call(this, el);
	this.quiz = options.quiz;
	this.model = options.model;
	this.readOnly = options.readOnly;
	this.id = options.id;

	if(!this.model.questions.length) {
		options.quiz.questions.forEach(function(question) {
			var q = new models.QuestionAttempt();
			q.questionId = question._id;
			q.question = question;

			if(question.answer_type === "radio" || question.answer_type === "checkbox") {
				q.options = [];
				question.options.forEach(function(option) {
					var y = new models.Option();
					y.title = option.title;
					q.options.push(y);
				});
			}
			this.model.questions.push(q);
		}.bind(this));
	} else {
		options.quiz.questions.forEach(function(question,i) {
			this.model.questions[i].question = question;
			this.model.questions[i].readOnly = true;
		}.bind(this));
	}

	this.delegate(".questions", "questions", new achilles.Collection(QuestionAttempt));
	this.on("click .submit", this.submit.bind(this));
}

util.inherits(QuizAttempt, achilles.View);

QuizAttempt.prototype.templateSync = require("../views/quiz.mustache");

QuizAttempt.prototype.submit = function() {
	this.model.date = new Date(Date.now());
	this.model.user = process.env.USER._id;
	this.model.save(function(err) {
		if(err) {
			throw err;
		}
		page("/courses/" + this.id + "/quizzes/" + this.quiz.index + "/attempts/" + this.model.index);
	}.bind(this));
}

var HEADER = window.location.protocol + "//" + window.location.host;
models.Course.connection = new achilles.Connection(HEADER + "/api");
models.User.connection = new achilles.Connection(HEADER + "/users");

function Login(el) {
	achilles.View.call(this, el);
	this.define("error", String);
	this.on("change:error", this.render.bind(this));
	this.on("keyup .password", this.keyup.bind(this));
	this.on("click .submit", this.submit.bind(this));
}

util.inherits(Login, achilles.View);

Login.prototype.submit = function() {
	var username = this.el.querySelector(".username").value;
	var password = this.el.querySelector(".password").value;
	request.post({url:HEADER + "/oauth/token", form:{
		grant_type:"password",
		client_id:"000000",
		username:username,
		password:password,
		client_secret:"000000"
	}}, function(err, res, body) {
		if(err) {
			throw err;
		} else if(res.statusCode === 500) {
			this.error = "The username or password is incorrect.";
		} else {
			var accessToken = JSON.parse(body).access_token;
			localStorage.setItem("access_token", accessToken);
			page(window.location.pathname || "/");
		}
	}.bind(this));
};

Login.prototype.keyup = function(e) {
	if(e.keyCode === 13) {
		this.submit();
	}
};

Login.prototype.templateSync = require("../views/login.mustache");

function ChangePasswordView(el) {
	achilles.View.call(this, el);
	this.on("click .submit", this.submit.bind(this));
}

util.inherits(ChangePasswordView, achilles.View);

ChangePasswordView.prototype.submit = function() {
	var oldPassword = this.el.querySelector(".old-password").value;
	var newPassword = this.el.querySelector(".new-password").value;
	if(!newPassword) {
		this.error = "New password must not be empty.";
		return this.render();
	}
	request.post({url:HEADER +"/userinfo/changePassword", json:{
		oldPassword: oldPassword,
		newPassword: newPassword
	}}, function(err, res, body) {
		if(res.statusCode === 500) {
			this.error = "Incorrect old password.";
			return this.render();
		}
		page("/");
	}.bind(this));
};

ChangePasswordView.prototype.templateSync = require("../views/changePassword.mustache");

function UsersList(el, options) {
	achilles.View.call(this, el);
	this.data = options.data;
}

util.inherits(UsersList, achilles.View);

UsersList.prototype.templateSync = require("../views/usersList.mustache");

function UsersCreate(el, options) {
	achilles.View.call(this, el);
	this.courses = options.courses;
	this.model = options.model;
	this.bind(".name", "name");
	this.bind(".role", "roles");
	this.on("click .submit", this.submit.bind(this));
	this.on("click .del", this.del.bind(this));
}

util.inherits(UsersCreate, achilles.View);

UsersCreate.prototype.templateSync = require("../views/usersForm.mustache");

UsersCreate.prototype.submit = function() {
	if(!this.model._id) {
		this.model.password = this.model.name;
	}

	this.model.save(function(err) {
		if(err) {
			throw err;
		}
		page("/users");
	});
};

UsersCreate.prototype.del = function() {
	this.model.del(function(err) {
		if(err) {
			throw err;
		}
		page("/users");
	});
};

function PerformanceGraph(el, options) {
	achilles.View.call(this, el);
	this.model = options.model;
	this.id = options.id;

	var peopl = {};
	this.model.attempts.forEach(function(attempt) {
		if(!(attempt.user in peopl) || peopl[attempt.user] < attempt.score) {
			peopl[attempt.user] = attempt.score;
		}
	});
	var people = [];
	for(var key in peopl) {
		people.push(peopl[key]);
	}
	this.lines = [];
	for(var i = 0; i < 100; i += 10) {
		this.lines.push({
			label: "≥ " + i + "%",
			value: people.filter(function(score) {
				return score > (this.model.questions.length / 100 * i) && score < (this.model.questions.length / 100 * (i + 10));
			}.bind(this)).length
		});
	}
	if(this.model.questions.length) {
		this.lines.push({
			label: "100%",
			value: people.filter(function(score) {
				return score === this.model.questions.length;
			}.bind(this)).length
		});
	}
};

util.inherits(PerformanceGraph, achilles.View);

var d3 = require("d3");

PerformanceGraph.prototype.templateSync = require("../views/graph.mustache");

PerformanceGraph.prototype.render = function() {
	achilles.View.prototype.render.call(this);
	var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

	var x = d3.scale.ordinal()
	    .rangeRoundBands([0, width], .1);

	var y = d3.scale.linear()
	    .range([height, 0]);

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom");

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left")
	    .ticks(10, "%");

	var svg = d3.select(this.el.querySelector(".svg")).append("svg")
	    .attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom))
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			x.domain(this.lines.map(function(d) { return d.label; }));
  y.domain([0, d3.max(this.lines, function(d) { return d.value; })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Frequency");

  svg.selectAll(".bar")
      .data(this.lines)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.label); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); });
};

function Link(el, options) {
	achilles.View.call(this, document.createElement("tr"));
	this.bind(".title", "title");
	this.bind(".url", "url");
	this.on("click .remove", this.remove.bind(this));
}

util.inherits(Link, achilles.View);

Link.prototype.templateSync = require("../views/link.mustache");

function Students(el, options) {
	achilles.View.call(this, el);
	this.model = options.model;
	this.id = options.id;
}

util.inherits(Students, achilles.View);

Students.prototype.templateSync = require("../views/students.mustache");

function Settings(el, options) {
	achilles.View.call(this, el);
	this.model = options.model;
	this.on("click .del", this.del.bind(this));
	this.on("click .add-link", this.addLink.bind(this));
	this.on("click .save-links", this.save.bind(this));
	this.delegate(".links", "links", new achilles.Collection(Link));
}

util.inherits(Settings, achilles.View);

Settings.prototype.addLink = function() {
	this.model.links.push(new models.Link());
};

Settings.prototype.del = function() {
	this.model.del(function(err) {
		if(err) {
			throw err;
		}
		page("/");
	});
};

Settings.prototype.save = function() {
	this.model.save(function(err) {
		if(err) {
			throw err;
		}
		page("/courses/" + this.model._id + "/settings");
	}.bind(this));
};

Settings.prototype.templateSync = require("../views/settings.mustache");

function QuizResults(el, options) {
	achilles.View.call(this, el);
	this.criterion = "best";
	this.quiz = options.quiz;
	this.users = options.users;
	this.generate();
	this.on("change .criterion", this.change.bind(this));
}

util.inherits(QuizResults, achilles.View);

QuizResults.prototype.templateSync = require("../views/quizResults.mustache")

QuizResults.prototype.render = function() {
	this.best = false; this.average = false; this.first = false;
	this[this.criterion] = true;
	achilles.View.prototype.render.call(this);
}

QuizResults.prototype.generate = function() {
	var attempts = {};
	this.quiz.attempts.forEach(function(attempt) {
		this.users.forEach(function(user) {
			if(user._id === attempt.user) {
				if(this.criterion === "average") {
					if(!(user.name in attempts)) {
						attempts[user.name] = [attempt.score];
					} else {
						attempts[user.name].push(attempt.score);
					}
				}
				if(this.criterion === "best" && (!(user.name in attempts) || attempt.score > attempts[user.name].score)) {
					attempts[user.name] = attempt;
				}
				if(this.criterion === "first" && (!(user.name in attempts) || attempt.date < attempts[user.name].date)) {
					attempts[user.name] = attempt;
				}
			}
		}.bind(this));
	}.bind(this));
	this.attempts = [];
	for(var user in attempts) {
		if(this.criterion === "average") {
			this.attempts.push({user: user, score:attempts[user].reduce(function(a, b) {return a + b}) / attempts[user].length});
		} else {
			this.attempts.push({user: user, score:attempts[user].score});
		}
	}
}

QuizResults.prototype.change = function(e) {
	this.criterion = e.target.value;
	this.generate();
	this.render();
};

function RandomNameGenerator(el, options) {
	achilles.View.call(this, el);
	this.users = options.users;
	this.on("click .start", this.start.bind(this));
}

util.inherits(RandomNameGenerator, achilles.View);

RandomNameGenerator.prototype.start = function(e) {
	this.el.querySelector(".name").innerHTML = this.users[Math.floor(Math.random() * this.users.length - 1) + 1].name;
}

RandomNameGenerator.prototype.templateSync = require("../views/randomNameGenerator.mustache");

var request = require("request");

var m = require("../views/courses.mustache");

var proxied = window.XMLHttpRequest.prototype.open;

var errorPage = require("../views/error.mustache");


/**
	* This is where the routing starts. It uses the page module.
	* See https://github.com/visionmedia/page.js
	*/

page(function(e,next) {
	if(process.env.USER) {
		document.body.classList.add("loggedIn");
		next();
	} else if(localStorage.getItem("access_token")) {
		window.XMLHttpRequest.prototype.open = function() {
				var y = proxied.apply(this, [].slice.call(arguments));
				this.setRequestHeader("Authorization", "Bearer " + localStorage.getItem("access_token"));
				return y;
		};

		request.get({url:HEADER+"/userinfo", json:true}, function(err, res, body) {
			if(err) {
				throw err;
			}
			if(res.statusCode === 500) {
				new Login(document.querySelector("body"));
				window.XMLHttpRequest.prototype.open = proxied;
			} else {
				process.env.USER = achilles.User.parse(body);
				document.body.classList.add("loggedIn");
				document.body.innerHTML = m({user:process.env.USER, admin: process.env.USER.roles.indexOf("admin") !== -1});
				document.querySelector(".dropdown-toggle").addEventListener("click", function(e) {
					e.stopPropagation();
					var menu = document.querySelector(".dropdown-menu");
					if(window.getComputedStyle(menu).display === "none") {
						menu.style.display = "block";
					} else {
						menu.style.display = "none";
					}
				});
				document.querySelector("body").addEventListener("click", function() {
					var menu = document.querySelector(".dropdown-menu");
					if(window.getComputedStyle(menu).display === "block") {
						menu.style.display = "none";
					}
				});
				document.querySelector(".logout").addEventListener("click", function() {
					localStorage.removeItem("access_token");
					delete process.env.USER;
					document.body.classList.remove("loggedIn");
					window.XMLHttpRequest.prototype.open = proxied;
				});
				next();
			}
		});
	} else {
		new Login(document.querySelector("body"));
	}
});

page("/", function() {
	models.Course.get(function(err, docs) {
		new ListView(document.querySelector("main"), docs);
	});
});

page("/create", function() {
	new CreateView(document.querySelector("main"), models.Course);
});

page("/courses/:course/:section", function(e, next) {
	models.Course.getById(e.params.course, function(err, doc) {
		new CourseView(document.querySelector("main"), {data: doc, section: e.params.section, id:doc._id});
		next();
	});
});

page("/courses/:course/blog", function(e) {
	models.Course.getById(e.params.course, function(err, doc) {
		new BlogView(document.querySelector(".course"), {data: doc.posts, id:doc._id});
	});
});

page("/courses/:course/blog/create", function(e) {
	models.Course.getById(e.params.course, function(err, doc) {
		var m = new models.Post();
		doc.posts.push(m);
		new CreatePostView(document.querySelector(".course"), {id:e.params.course, model: m});
	});
});

page("/courses/:course/blog/:post", function(e) {
	models.Course.getById(e.params.course, function(err, doc) {
		new PostView(document.querySelector(".course"), {data: doc.posts[e.params.post], id:doc._id});
	});
});

page("/courses/:course/blog/:post/edit", function(e) {
	models.Course.getById(e.params.course, function(err, doc) {
		new CreatePostView(document.querySelector(".course"), {model: doc.posts[e.params.post], id:doc._id});
	});
});

page("/courses/:course/vocab_quizzes", function(e) {
	models.Course.getById(e.params.course, function(err, doc) {
		new ListQuizView(document.querySelector(".course"), {data: doc.vocabQuizzes, id:doc._id, section:"vocab_quizzes", title:"Vocabulary Quizzes"});
	});
});

page("/courses/:course/vocab_quizzes/create", function(e) {
	models.Course.getById(e.params.course, function(err, doc) {
		var m = new models.VocabQuiz();
		doc.vocabQuizzes.push(m);
		new CreateVocabQuizView(document.querySelector(".course"), {id:doc._id, model:m});
	});
});

page("/courses/:course/vocab_quizzes/:quiz", function(e) {
	models.Course.getById(e.params.course, function(err, doc) {
		new VocabQuiz(document.querySelector(".course"), {id:doc._id, data:doc.vocabQuizzes[e.params.quiz]});
	});
});

page("/courses/:course/vocab_quizzes/:quiz/edit", function(e) {
	models.Course.getById(e.params.course, function(err, doc) {
		new CreateVocabQuizView(document.querySelector(".course"), {id:doc._id, model:doc.vocabQuizzes[e.params.quiz]});
	});
});

page("/courses/:course/quizzes", function(e) {
	models.Course.getById(e.params.course, function(err, doc) {
		new ListQuizView(document.querySelector(".course"), {data: doc.quizzes, id:doc._id, section:"quizzes", title:"Quizzes"});
	});
});

page("/courses/:course/quizzes/create", function(e) {
	models.Course.getById(e.params.course, function(err, doc) {
		var m = new models.Quiz();
		doc.quizzes.push(m);
		m.questions.push(new models.Question());
		new CreateQuiz(document.querySelector(".course"), {model:m, id:doc._id});
	});
});

page("/courses/:course/quizzes/:quiz", function(e) {
	models.Course.getById(e.params.course, function(err, doc) {
		new QuizDetails(document.querySelector(".course"), {model: doc.quizzes[e.params.quiz], id:doc._id});
	});
});

page("/courses/:course/quizzes/:quiz/edit", function(e) {
	models.Course.getById(e.params.course, function(err, doc) {
		new CreateQuiz(document.querySelector(".course"), {model: doc.quizzes[e.params.quiz], id:doc._id});
	});
});

page("/courses/:course/quizzes/:quiz/attempt", function(e) {
	models.Course.getById(e.params.course, function(err, doc) {
		var y = new models.QuizAttempt();
		doc.quizzes[e.params.quiz].attempts.push(y);
		new QuizAttempt(document.querySelector(".course"), {model: y, id:doc._id, quiz:doc.quizzes[e.params.quiz]});
	});
});

page("/courses/:course/quizzes/:quiz/attempts/:attempt", function(e, next) {
	models.Course.getById(e.params.course, function(err, doc) {
		if(doc.quizzes[e.params.quiz].attempts[e.params.attempt].user !== process.env.USER._id) {
			return next();
		}
		new QuizAttempt(document.querySelector(".course"), {model: doc.quizzes[e.params.quiz].attempts[e.params.attempt], id:doc._id, quiz:doc.quizzes[e.params.quiz], readOnly:true});
	});
});

page("/courses/:course/quizzes/:quiz/graph", function(e) {
	models.Course.getById(e.params.course, function(err, doc) {
		new PerformanceGraph(document.querySelector(".course"), {model: doc.quizzes[e.params.quiz], id:doc._id});
	});
});

page("/courses/:course/quizzes/:quiz/results", function(e) {
	models.Course.getById(e.params.course, function(err, doc) {
		request.get({url:HEADER+ "/api/" + e.params.course + "/students", json:true}, function(err, res, body) {
			new QuizResults(document.querySelector(".course"), {quiz: doc.quizzes[e.params.quiz], users:body});
		});
	});
});

page("/courses/:course/students", function(e) {
	request.get({url:HEADER+ "/api/" + e.params.course + "/students", json:true}, function(err, res, body) {
		new Students(document.querySelector(".course"), {model: body, id:e.params.course});
	});
});

page("/courses/:course/randomNameGenerator", function(e) {
	request.get({url:HEADER+ "/api/" + e.params.course + "/students", json:true}, function(err, res, body) {
		new RandomNameGenerator(document.querySelector(".course"), {users: body, id:e.params.course});
	});
});

page("/courses/:course/settings", function(e) {
	models.Course.getById(e.params.course, function(err, doc) {
		new Settings(document.querySelector(".course"), {model: doc});
	});
});

page("/changePassword", function(e) {
	new ChangePasswordView(document.querySelector("main"));
});

page("/users", function(e) {
	achilles.User.get(function(err, docs) {
		new UsersList(document.querySelector("main"), {data:docs});
	});
});

page("/users/create", function(e) {
	models.Course.get(function(err, courses) {
		new UsersCreate(document.querySelector("main"), {courses:courses, model:new achilles.User()});
	});
});

page("/users/:user", function(e) {
	achilles.User.getById(e.params.user, function(err, user) {
		models.Course.get(function(err, courses) {
			new UsersCreate(document.querySelector("main"), {courses:courses, model:user});
		});
	});
});

window.addEventListener("load", page);
