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
	this.define("questions", [VocabQuestion]);
	this.define("randomise_questions", Boolean);
	this.define("long", Boolean);

	this.questions = [];
}

util.inherits(VocabQuiz, achilles.Model);

module.exports.VocabQuestion = VocabQuestion;
module.exports.VocabQuiz = VocabQuiz;
