var util = require("util");
var achilles = require("achilles");

function VocabQuestion() {
	achilles.Model.call(this);
	this.define("question", String);
	this.define("answer", String);
}

util.inherits(VocabQuestion, achilles.Model);

function VocabQuiz() {
	achilles.Model.call(this);
	this.define("title", String);
	this.define("type", String); // short, long, crossword
	this.define("questions", [VocabQuestion]);
	this.define("randomise_questions", Boolean);

	Object.defineProperty(this, "long", {
		get: function() {
			return this.type === "long";
		}
	});

	this.questions = [];
}

util.inherits(VocabQuiz, achilles.Model);

module.exports.VocabQuestion = VocabQuestion;
module.exports.VocabQuiz = VocabQuiz;
