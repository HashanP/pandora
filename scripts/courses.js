var models = require("../models");
var achilles = require("achilles");
var page = require("page");
var util = require("util");
var Editor = require("./Editor");

MathJax.Hub.Config({
	tex2jax: {
		displayMath: [],
		inlineMath: []
	},
	showMathMenu:false,
	"HTML-CSS": { linebreaks: { automatic: true } },
         SVG: { linebreaks: { automatic: true } }
});

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
}

util.inherits(ListView, achilles.View);

ListView.prototype.templateSync = require("../views/list.mustache");

function CreateView(el) {
	achilles.View.call(this, el.cloneNode(true));
	el.parentNode.replaceChild(this.el, el);
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
	console.log(this.model);
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
	this[options.section] = true;
}

util.inherits(CourseView, achilles.View);

CourseView.prototype.templateSync = require("../views/course.mustache");

function BlogView(el, options) {
	achilles.View.call(this, el);
	this.data = options.data;
	this.id = options.id;
	console.log(this.id);
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
		page("/course/" + this.id + "/blog");
	}.bind(this));
};

BlogView.prototype.render = PostView.prototype.render = function() {
	achilles.View.prototype.render.call(this);
	MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.el]);
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
	console.log(this.model);
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
		page("/course/" + this.id + "/blog");
	}.bind(this));
};

CreatePostView.prototype.templateSync = require("../views/createPost.mustache");

function ListQuizView(el, options) {
	achilles.View.call(this, el, options);
	this.title = options.title;
	this.data = options.data;
	console.log(this.data);
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

VocabQuestion.prototype.remove = function(e) {
	e.preventDefault();
	this.model.remove();
};

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

CreateVocabQuizView.prototype.templateSync = require("../views/createVocabQuiz.mustache");

CreateVocabQuizView.prototype.submit = function() {
	console.log(this.model);
	if(!this.model.container) {
		console.log("here");
		var nova = new models.Course();
		nova._id = this.id;
		nova.vocabQuizzes = [this.model];
	}
	this.model.save(function(err) {
		if(err) {
			throw err;
		}
		page("/course/" + this.id + "/vocab_quizzes");
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
		page("/course/" + this.id + "/vocab_quizzes");
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

Option.prototype.templateSync = require("../views/option.mustache")

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
		console.log("here");
		new Question(this.el.querySelector(".current_question"), {model: this.currentQuestion});
		this.el.querySelector(".button-" + this.currentQuestion.index).classList.add("active");
	}
};

CreateQuiz.prototype.templateSync = require("../views/createQuiz.mustache")

CreateQuiz.prototype.addQuestion = function() {
	this.currentQuestionIndex = this.model.questions.length;
	this.model.questions.push(new models.Question());
};

CreateQuiz.prototype.submit = function() {
	this.model.save(function(err) {
		if(err) {
			throw err;
		}
		page("/course/" + this.id + "/quizzes");
	}.bind(this));
};

function QuizDetails(el, options) {
	achilles.View.call(this, el);

	this.id = options.id;
	this.model = options.model;
}

util.inherits(QuizDetails, achilles.View);

QuizDetails.prototype.templateSync = require("../views/quizDetails.mustache");

function QuestionAttempt(el, options) {
	achilles.View.call(this, document.createElement("div"));
	this.bind(".answer_text", "answer_text");
	this.bind(".answer_number", "answer_number");
}

util.inherits(QuestionAttempt, achilles.View);

QuestionAttempt.prototype.templateSync = require("../views/question.mustache");

function QuizAttempt(el, options) {
	achilles.View.call(this, el);
	this.quiz = options.quiz;
	this.model = options.model;
	this.readOnly = options.readOnly;

	if(!this.model.questions) {
		options.quiz.questions.forEach(function(question) {
			var q = new models.QuestionAttempt();
			q.questionId = question._id;
			q.question = question;
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
	this.model.save(function(err) {
		if(err) {
			throw err;
		}
		page("/course/" + this.id + "/quizzes/" + this.quiz.index + "/attempt/" + this.model.index);
	}.bind(this));
}

models.Course.connection = new achilles.Connection(window.location.protocol + "//" + window.location.host + "/courses");

window.onload = function() {
	var main = document.querySelector("main");
	page("/", function() {
		console.log("here");
		models.Course.get(function(err, docs) {
			console.log(docs);
			new ListView(document.querySelector("main"), docs);
		});
	});
	page("/create", function() {
		new CreateView(document.querySelector("main"), models.Course);
	});
	page("/course/:course/:section", function(e, next) {
		models.Course.getById(e.params.course, function(err, doc) {
			new CourseView(document.querySelector("main"), {data: doc, section: e.params.section});
			next();
		});
	});
	page("/course/:course/blog", function(e) {
		models.Course.getById(e.params.course, function(err, doc) {
			new BlogView(document.querySelector(".course"), {data: doc.posts, id:doc._id});
		});
	});
	page("/course/:course/blog/create", function(e) {
		models.Course.getById(e.params.course, function(err, doc) {
			var m = new models.Post();
			doc.posts.push(m);
			new CreatePostView(document.querySelector(".course"), {id:e.params.course, model: m});
		});
	});
	page("/course/:course/blog/:post", function(e) {
		models.Course.getById(e.params.course, function(err, doc) {
			new PostView(document.querySelector(".course"), {data: doc.posts[e.params.post], id:doc._id});
		});
	});
	page("/course/:course/blog/:post/edit", function(e) {
		console.log("here");
		models.Course.getById(e.params.course, function(err, doc) {
			new CreatePostView(document.querySelector(".course"), {model: doc.posts[e.params.post], id:doc._id});
		});
	});
	page("/course/:course/vocab_quizzes", function(e) {
		models.Course.getById(e.params.course, function(err, doc) {
			new ListQuizView(document.querySelector(".course"), {data: doc.vocabQuizzes, id:doc._id, section:"vocab_quizzes", title:"Vocabulary Quizzes"});
		});
	});
	page("/course/:course/vocab_quizzes/create", function(e) {
		models.Course.getById(e.params.course, function(err, doc) {
			var m = new models.VocabQuiz();
			doc.vocabQuizzes.push(m);
			new CreateVocabQuizView(document.querySelector(".course"), {id:doc._id, model:m});
		});
	});
	page("/course/:course/vocab_quizzes/:quiz", function(e) {
		models.Course.getById(e.params.course, function(err, doc) {
			new VocabQuiz(document.querySelector(".course"), {id:doc._id, data:doc.vocabQuizzes[e.params.quiz]});
		});
	});
	page("/course/:course/vocab_quizzes/:quiz/edit", function(e) {
		models.Course.getById(e.params.course, function(err, doc) {
			new CreateVocabQuizView(document.querySelector(".course"), {id:doc._id, model:doc.vocabQuizzes[e.params.quiz]});
		});
	});
	page("/course/:course/quizzes", function(e) {
		models.Course.getById(e.params.course, function(err, doc) {
			new ListQuizView(document.querySelector(".course"), {data: doc.quizzes, id:doc._id, section:"quizzes", title:"Quizzes"});
		});
	});
	page("/course/:course/quizzes/create", function(e) {
		models.Course.getById(e.params.course, function(err, doc) {
			var m = new models.Quiz();
			doc.quizzes.push(m);
			m.questions.push(new models.Question());
			new CreateQuiz(document.querySelector(".course"), {model:m, id:doc._id});
		});
	});
	page("/course/:course/quizzes/:quiz", function(e) {
		models.Course.getById(e.params.course, function(err, doc) {
			new QuizDetails(document.querySelector(".course"), {model: doc.quizzes[e.params.quiz], id:doc._id});
		});
	});
	page("/course/:course/quizzes/:quiz/edit", function(e) {
		models.Course.getById(e.params.course, function(err, doc) {
			new CreateQuiz(document.querySelector(".course"), {model: doc.quizzes[e.params.quiz], id:doc._id});
		});
	});
	page("/course/:course/quizzes/:quiz/attempt", function(e) {
		models.Course.getById(e.params.course, function(err, doc) {
			var y = new models.QuizAttempt();
			doc.quizzes[e.params.quiz].attempts.push(y);
			new QuizAttempt(document.querySelector(".course"), {model: y, id:doc._id, quiz:doc.quizzes[e.params.quiz]});
		});
	});
	page("/course/:course/quizzes/:quiz/attempts/:attempt", function(e) {
		models.Course.getById(e.params.course, function(err, doc) {
			new QuizAttempt(document.querySelector(".course"), {model: doc.quizzes[e.params.quiz].attempts[e.params.attempt], id:doc._id, quiz:doc.quizzes[e.params.quiz], readOnly:true});
		});
	});
	page();
};
