var util = require("util");
var achilles = require("achilles");
var Content = require("./Content");
var Option = require("./Option");

function Question() {
	achilles.Model.call(this);

	this.define("content", Content);
	this.define("answer_type", String); // "text", "number", "radio", "checkbox"
	this.define("options", [Option]);
	this.options = [];

	Object.defineProperty(this, "number", {
		get: function() {
			return this.index + 1;
		}
	});

	Object.defineProperty(this, "isSimple", {
		get: function() {
			return this.answer_type === "text" || this.answer_type === "number";
		}
	});

	Object.defineProperty(this, "isNumber", {
		get: function() {
			return this.answer_type === "number";
		}
	});

	Object.defineProperty(this, "isText", {
		get: function() {
			return this.answer_type === "text";
		}
	});

	Object.defineProperty(this, "answer", {
		get: function() {
				if(this.isSimple) {
					return this.options.map(function(option) {
						return option.title;
					}).join(", ");
				} else {
					return this.options.filter(function(option) {
						return option.correct;
					}).map(function(option) {
						return option.title;
					}).join(", ");
				}
		}
	});

	this.answer_type = "text";
	this.content = new Content();
}

util.inherits(Question, achilles.Model);

module.exports.Question = Question;

function QuestionAttempt() {
	achilles.Model.call(this);

	this.define("questionId", String); // refers to question
	this.define("answer_text", String);
	this.define("answer_number", Number);
	this.define("options", [Option]);

	Object.defineProperty(this, "correct", {
		get: function() {
			if(!this.question) {
				this.question = this.container.container.container.container.questions[this.index];
			}
			var i = 0;
			if(this.question.answer_type === "text") {
				if(this.answer_text === undefined) {
					return false;
				}
				for(i = 0; i < this.question.options.length; i++) {
					console.log(this.question.options[i].title);
					console.log(this.answer_text);
					if(this.question.options[i].title.toLowerCase() === this.answer_text.toLowerCase()) {
						return true;
					}
				}
				return false;
			} else if(this.question.answer_type === "number") {
				if(this.answer_number === undefined) {
					return false;
				}
				for(i = 0; i < this.question.options.length; i++) {
					if(this.question.options[i].title === this.answer_number.toString()) {
						return true;
					}
				}
				return false;
			} else {
				if(this.options === undefined) {
					return false;
				}
				console.log(this.options);
				for(i = 0; i < this.question.options.length; i++) {
					if(!this.question.options[i].correct !== !this.options[i].correct) {
						return false;
					}
				}
				return true;
			}
		}
	});
}

util.inherits(QuestionAttempt, achilles.Model);

module.exports.QuestionAttempt = QuestionAttempt;

function QuizAttempt() {
	achilles.Model.call(this);

	this.ref("user", achilles.User);
	this.define("questions", [QuestionAttempt]);
	this.define("date", Date);

	this.questions = [];

	Object.defineProperty(this, "score", {
		get: function() {
			var i = 0;
			this.questions.forEach(function(question) {
				if(question.correct) {
					i++;
				}
			}.bind(this));
			return i;
		}
	});
}

util.inherits(QuizAttempt, achilles.Model);

module.exports.QuizAttempt = QuizAttempt;

function Quiz() {
	achilles.Model.call(this);

	this.define("questions", [Question]);
	this.define("title", String);
	this.define("randomise_questions", Boolean);
	this.define("attempts", [QuizAttempt]);

	this.questions = [];
	this.attempts = [];
}

util.inherits(Quiz, achilles.Model);

module.exports.Quiz = Quiz;
