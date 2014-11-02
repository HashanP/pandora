var util = require("util");
var achilles = require("achilles");
var Content = require("./Content");
var Option = require("./Option");

function Question() {
	achilles.Model.call(this);

	this.define("content", Content);
	this.define("answer_type", String); // "text", "number", "radio", "checkbox"
	this.define("answer_text", String);
	this.define("answer_number", Number);
	this.define("options", [Option]);
	this.options = [];

	Object.defineProperty(this, "number", {
		get: function() {
			return this.index + 1;
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

	Object.defineProperty(this, "isRadio", {
		get: function() {
			return this.answer_type === "radio";
		}
	});

	Object.defineProperty(this, "isCheckbox", {
		get: function() {
			return this.answer_type === "checkbox";
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
			if(this.question.answer_type === "text") {
				return  this.answer_text && this.question.answer_text.toLowerCase() === this.answer_text.toLowerCase();
			} else if(this.question.answer_type === "number") {
				return this.question.answer_number === this.answer_number;
			} else {
				console.log(this.question.options);
				console.log(this.options);
				for(var i = 0; i < this.question.options.length; i++) {
console.log(this.question.options[i].v);
console.log(this.options[i]);
					if(this.question.options[i].correct !== this.options[i].correct) {
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
