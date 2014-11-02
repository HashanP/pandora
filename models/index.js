var models = {};

models.Content = require("./Content");
models.Post = require("./Post");
models.Question = require("./Quiz").Question;
models.QuizAttempt = require("./Quiz").QuizAttempt;
models.QuestionAttempt = require("./Quiz").QuestionAttempt;
models.Quiz = require("./Quiz").Quiz;
models.VocabQuiz = require("./VocabQuiz").VocabQuiz;
models.VocabQuestion = require("./VocabQuiz").VocabQuestion;
models.Course = require("./Course");
models.Club = require("./Club");
models.Option = require("./Option");
models.User = require("./User");

module.exports = models;
