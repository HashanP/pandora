Template.createVocabQuiz.onRendered(function() {
	$(".vocab-questions tbody").sortable({
		handle:".move",
		cancel:""
	});
});

Template.vocabQuiz.events({
  "keyup input.answer": function(e) {
    if(e.target.dataset.answer.toLowerCase().split(",").map(function(str) {return str.trim()}).indexOf(e.target.value.toLowerCase().trim()) !== -1) {
      if(!e.target.classList.contains("correct")) {
        e.target.classList.add("correct");
        e.target.classList.remove("incorrect");
        if(e.target.nextElementSibling && e.target.nextElementSibling.nextElementSibling) {
          e.target.nextElementSibling.nextElementSibling.focus();
        } else {
          e.target.blur();
        }
      }
    } else if(e.target.value !== "") {
      e.target.classList.add("incorrect");
      e.target.classList.remove("correct");
    }
  },
  "click .reveal-answers": function() {
      Template.instance().findAll("input").forEach(function(el) {
        if(!el.classList.contains("correct")) {
          el.classList.add("incorrect");
        }
        el.value = el.dataset.answer;
        el.readOnly = true;
      });
		},
  "click .reset": function() {
      Template.instance().findAll("input").forEach(function(el) {
        el.value = "";
        el.classList.remove("correct");
        el.classList.remove("incorrect");
        el.readOnly = false;
      });
    return false;
  }
});

Template.create_quiz.events({
	"click .add-question": function() {
		Session.set("bigError", "");
		questions.push({
			title: "",
			help_text: "",
			type: "text",
			possibleTextAnswers: [""]
		});
		Session.set("originalType", "text");
		Session.set("activeType", "text");
		Session.set("active", questions.length -1);
		Session.set("activeAnswer", questions.list()[Session.get("active")]);
		$(".add-question").attr("disabled", true);
	},
	"click .done": function() {
		var p = {
			help_text: $(".help-text").val(),
			type: $(".type").val(),
		};
		if(p.type !== "fill_in_the_blanks") {
			p.title = $(".question-title").val();
		}
		if(Session.equals("activeType", "fill_in_the_blanks")) {
			p.text = $(".fill-in-the-blanks").text();
		} else if(Session.equals("activeType", "text")) {
			p.possibleTextAnswers = _.map($(".opt"), function(el) {
				return $(el).find(".option").val();
			});
		} else if(Session.equals("activeType", "number")) {
			p.possibleNumberAnswers = _.map($(".opt"), function(el) {
				return $(el).find(".option").val();
			});
		} else {
			p.options = _.map($(".opt"), function(el) {
				if($(el).find(".active").is(":checked")) {
					return {value: $(el).find(".option").val(), active: true};
				} else {
					return {value: $(el).find(".option").val()};
				}
			});
		}
		if(p.type !== "fill_in_the_blanks" && p.title === "") {
			return Session.set("error", "Question title cannot be blank.");
		} else if((p.options && p.options.length === 0) || (p.possibleTextAnswers && p.possibleTextAnswers.length === 0) || 
			(p.possibleNumberAnswers && p.possibleNumberAnswers.length === 0)) {
			return Session.set("error", "There must be at least one correct answer.");
		} else if((p.options && p.options.length > 20) || (p.possibleTextAnswers && p.possibleTextAnswers.length > 20) || 
			(p.possibleNumberAnswers && p.possibleNumberAnswers.length > 20)) {
			return Session.set("error", "There cannot be more than 20 correct answers.");	
		} else if(p.type !== "fill_in_the_blanks" && p.title.length > 200) {
			return Session.set("error", "Title cannot be longer than 200 characters.");
		}
		if(p.type === "text") {
			for(var i = 0; i < p.possibleTextAnswers.length; i++) {
				if(p.possibleTextAnswers[i].trim() === "") {
					return Session.set("error", "Answer(s) cannot be empty.");
				} else if(p.possibleTextAnswers[i].length > 100) {
					return Session.set("error", "Answer(s) can not be longer than 100 characters.");
				}
			}	
		} else if(p.type === "number") {
			for(var i = 0; i < p.possibleNumberAnswers.length; i++) {
				if(p.possibleNumberAnswers[i] === "") {
					return Session.set("error", "Answer(s) cannot be empty.");
				}
			}	
		}  else if(p.type === "list" || p.type === "checkboxes") {
			for(var i = 0; i < p.options.length; i++) {
				if(p.options[i].value.trim() === "") {
					return Session.set("error", "Options cannot be empty.");
				}
			}
		} else if(p.type === "fill_in_the_blanks" && p.text.trim() === "") {
			return Session.set("error", "Fill in the gaps text cannot be empty.");
		} else if(p.type === "fill_in_the_blanks" && p.text.length > 1000) {
			return Session.set("error", "Fill in the gaps text cannot be longer than 1000 characters.");
		}
		questions.splice(this.index, 1, p);
		Session.set("active", undefined);
		Session.set("error", undefined);
		$(".add-question").attr("disabled", false);
	},
	"click .edit": function() {
		Session.set("active", this.index);
		Session.set("activeType", window.questions.list()[this.index].type);
		Session.set("originalType", Session.get("activeType"));
		if(Session.equals("activeType", "fill_in_the_blanks")) {
			window.setTimeout(function() {
				$(".fill-in-the-blanks").trigger("keyup");
			}, 0);
		}
	},
	"click .del": function() {
		questions.splice(this.index, 1);
	},
	"click .cancel": function() {
		if(this.title === "") {
			questions.pop();
		}
		Session.set("active", undefined);
		Session.set("error", undefined);
		$(".add-question").attr("disabled", false);
	},
	"click .add-option-container": function(e) {
		var c = {
			type: Session.get("activeType")
		}
		if(Session.equals("activeType", "list")) {
			c.type = "text";
			c.list = true;
		} else if(Session.equals("activeType", "checkboxes")) {
			c.type = "text";
			c.checkboxes = true;
		}
		Blaze.renderWithData(Template.option, c, e.target.parentNode.parentNode, e.target.parentNode); 
	},
	"change .type": function(e) {
		Session.set("activeType", e.target.value);	
		if(!Session.equals("originalType", Session.get("activeType"))) {
			window.setTimeout(function() {
				if(["checkboxes", "list"].indexOf(Session.get("activeType")) !== -1) {
					$(".add-option").click();
				}
				$(".add-option").click();
			}, 0);
		}
	},
	"keyup .fill-in-the-blanks": function(e) {
		try {
			var d = saveSelection(e.target);
		} catch(e) {}
		$(e.target).html($(e.target).text().replace(/\[[a-zA-Z,\s\.'"\d]+\]/g, function(match) {
			return "<span class=\"green\">" + match + "</span>";
		}));
		try {
			restoreSelection(e.target, d);
		} catch(e) {}
	},
	"click .submit": function() {
		if(questions.list().length === 0) {
			return Session.set("bigError", "There must be at least 1 question.");
		} else if(questions.list().length > 100) {
			return Session.set("bigError", "There can at most be 100 questions.");
		}
		var data = Template.instance().data;
		$(".question.active .done").trigger("click");
		window.setTimeout(function() {
			if($(".text-danger").length === 0) {
				if(data.quizId) {
					Quizzes.update(data.quizId, {$set: {questions: Array.prototype.slice.call(questions.list())}});		
					Router.go("/rooms/" + data._id + "/quizzes" + (Session.get("path") === "/" ? "/" : "/" + Session.get("path")));
				} else {
					Modal.show("quizFilename", data);
				}
			}
		});
	}
}); 

Template.createVocabQuiz.events({
	"click .add-question": function() {
		Blaze.render(Template.vocabQuestion, $(".vocab-questions tbody").get(0));
	},
	"click .add-rows-10": function() {
		for(var i = 0; i < 10; i++) {
			Blaze.render(Template.vocabQuestion, $(".vocab-questions tbody").get(0));
		}
	},
	"click .submit": function() {
		_.each($(".vocab-questions tbody").children(), function(tr) {
			questions.push({
				question: $(tr).find(".vocab-question").val(),
				answer: $(tr).find(".vocab-answer").val()
			});
		});
		if(Template.instance().data.quizId) {
			VocabQuizzes.update(Template.instance().data.quizId, {$set: {questions: Array.prototype.slice.call(questions.list())}});		
			Router.go("/rooms/" + Template.instance().data._id + "/quizzes" + (Session.get("path") === "/" ? "/" : "/" + Session.get("path")));
		} else {
			Modal.show("quizFilename", Template.instance().data);
		}
	}
});

Template.vocabQuestion.events({
	"click .del": function(e) {
		$(e.target).closest("tr").remove();	
	}
});

Template.quizFilename.events({
	"click .submit": function() {
		var q = Array.prototype.slice.call(questions.list());
		if(Router.current().params.query.create === "quiz") {
			Meteor.call("createQuiz", Template.instance().data._id, Session.get("path"), $(".quiz-title").val(), q);	
		} else {
			Meteor.call("createVocabQuiz", Template.instance().data._id, Session.get("path"), $(".quiz-title").val(), q);		
		}
		Modal.hide("quizFilename");
		Router.go("/rooms/" + Template.instance().data._id + "/quizzes" + (Session.get("path") === "/" ? "/" : "/" + Session.get("path")));
	}
});

Template.vocabQuiz.onCreated(function()	{
	this.subscribe("vocabQuizzes", this.data.quizId);
});

Template.option.events({
	"click .remove": function(e) {
		$(e.target).closest(".opt").remove();
		Blaze.remove(Blaze.currentView);
	}
});

var oldMouseStart = $.ui.sortable.prototype._mouseStart;
$.ui.sortable.prototype._mouseStart = function(event, overrideHandle, noActivation) {
   this._trigger("beforestart", event, this._uiHash());
	 oldMouseStart.apply(this, [event, overrideHandle, noActivation]);
};

Template.create_quiz.onCreated(function() {
	Session.set("error");
	var quizId = this.data.quizId;
	this.subscribe("quizzes", quizId, function() {
		var t = Quizzes.findOne(quizId);
		t.questions.forEach(function(x) {
			window.questions.push(x);	
		});
	});
});

Template.create_quiz.onRendered(function() {
	$(".question-list").sortable({
		update: function(e, ui) {
			var i = $(ui.item).index();
			var c = parseInt($(ui.item).data("index"));
			$(this).sortable("cancel");
			var p = questions.splice(i, 0, questions.splice(c, 1)[0]);
			Deps.flush();
		},
		beforestart: function(e, ui) {
			if($(".question-list").is(".in-progress")) {
				throw "Haha";
			}
		},
		items: "> .question:not(.active)"
	});
	if(!this.data.quizId) {
		$(".add-question").trigger("click");
	}
});

Template.create_quiz.helpers({
	questions: function() {
		return questions.list();
	},
	isActive: function(x) {
		return Session.equals("active", x);
	},
	activeType: function() {
		return Session.get("activeType");
	},
	active: function() {
		return Session.equals("active", this.index) ? "active": "";
	},
	inProgress: function() {
		return Session.get("active") !== undefined ? "in-progress" : "";
	},
	bigError: function() {
		return Session.get("bigError");
	}
});

Template.vocabQuiz.helpers({
	questions: function() {
		return VocabQuizzes.findOne(Template.instance().data.quizId).questions;
	},
	path: function() {
		return Session.get("path");
	}
});

Template.createVocabQuiz.onCreated(function() {
	if(this.data.quizId) {
		this.subscribe("vocabQuizzes", this.data.quizId);
	}
});

Template.createVocabQuiz.helpers({
	questions: function() {
		VocabQuizzes.findOne(Template.instance().data.quizId).questions;
	}
});


Template.quiz.onCreated(function() {
	this.subscribe("quizzes", this.data.quizId);
});

Template.quiz.helpers({
	questions: function() {
		return Quizzes.findOne(Template.instance().data.quizId).questions;
	}
});

Template.quiz.events({
	"click .submit": function(e) {
		var obj = [];
		_.each($(".question"), function(el) {
			var c = Blaze.getData(el);
			var y = {};
			if(c.type === "text" || c.type === "number") {
				y.answer = $(el).find("input").val();
			} else if(c.type === "list") {
				y.answer = $(el).find("input[checked]").val();
			} else if(c.type ==="checkboxes") {
				y.answer = _.map($(el).find("input[checked]"), function(i) {
					return $(i).val();
				});
			} else {
				y.fitbAnswer = _.map($(el).find("input"), function(d) {
					return $(d).val();
				});
			}	
			obj.push(y);
		});
		var y = Template.instance().data;
		Meteor.call("attemptQuiz", Template.instance().data.quizId, obj, function(err, id) {
			Router.go("/rooms/" + y._id + "/quizzes" + (Session.get("path") === "/" ? Session.get("path") : "/" + Session.get("path")) + "/attempts/" + id);
		});
	}
});

Template.quizResult.onCreated(function() {
	this.subscribe("quizResults", this.data.quizId);
});

Template.quizResult.helpers({
	questions: function() {
		return QuizResults.findOne(Template.instance().data.attemptId).questions;
	},
	correct: function() {
		return this.correct ? "has-success" : "has-error";
	}
});

Template.quizIntro.onCreated(function() {
	this.subscribe("quizResults", this.data.quizId);
});

Template.quizIntro.helpers({
	previousAttempts: function() {
		return _.sortBy(QuizResults.find({quizId: Template.instance().data.quizId, userId: Meteor.userId()}).fetch(), "date").reverse();	
	},
	path: function() {
		return Session.get("path");
	}
});

Template.quizBarGraph.helpers({
	results: function() {
		return QuizResults.find({quizId: Template.instance().data.quizId, userId: Meteor.userId()}).fetch();
	}
});

Template.quizBarGraph.onCreated(function() {
	this.subscribe("quizResults", this.data.quizId);
});

Template.quizBarGraph.events({
	"change .criterion": function(e) {
		Session.set("criterion", e.target.value);
	}
});

Template.quizBarGraph.onRendered(function() {
	var c = Template.instance().data;
	this.autorun(function() {
		var attempts = QuizResults.find({quizId: c.quizId}).fetch();
		var attemptsObj = {};
		attempts.forEach(function(attempt) {
			if(!(attempt.userId in attemptsObj)) {
				attemptsObj[attempt.userId] = {
					first: attempt,
					best: attempt,
					last: attempt,
					average:[attempt]
				};
			} else {
				if(attemptsObj[attempt.userId].first.date > attempt.date) {
					attemptsObj[attempt.userId].first = attempt;
				}
				if(attemptsObj[attempt.userId].last.date < attempt.date) {
					attemptsObj[attempt.userId].last = attempt;
				}
				if(attemptsObj[attempt.userId].best.score < attempt.score) {
					attemptsObj[attempt.userId].best = attempt;
				}
				attemptsObj[attempt.userId].average.push(attempt);
			}
		});
		var attempts2 = [];
		for(var key in attemptsObj) {
			if(Session.equals("criterion", "first")) {
				attempts2.push({user: Meteor.users.findOne(key).username, score: attemptsObj[key].first.score, max: attemptsObj[key].first.max, _id: attemptsObj[key].first._id});	
			} else if(Session.equals("criterion", "average")) {
				attempts2.push({user: Meteor.users.findOne(key).username, score: attemptsObj[key].average.reduce(function(a, b) {return a + b}) / attemptsObj[key].length});
			} else if(Session.equals("criterion", "last")) {
				attempts2.push({user: Meteor.users.findOne(key).username, score: attemptsObj[key].last.score, max: attemptsObj[key].last.max, _id: attemptsObj[key].last._id});
			} else if(Session.equals("criterion", "best")) {
				attempts2.push({user: Meteor.users.findOne(key).username, score: attemptsObj[key].best.score, max: attemptsObj[key].best.max, _id: attemptsObj[key].best._id});
			}
		}
		 var HEIGHT = attempts2.length * 30;
			
		$(".svg svg").remove();
		 var canvas = d3.select($(".svg").get(0))
      .append('svg')
      .attr({viewBox:"0 0 907 " + (HEIGHT + 70)});

      var color = d3.scale.quantize()
      .domain([0, 1])
      .range(colorbrewer.RdYlGn[9]);

      var xscale = d3.scale.linear()
      .domain([0, 1])
      .range([0,722]);

      var yscale = d3.scale.linear()
      .domain([0, attempts2.length])
      .range([0, HEIGHT + 6]);

      var	yAxis = d3.svg.axis();
      yAxis
      .orient('left')
      .scale(yscale)
      .tickSize(4)
      .tickFormat(function(d,i){ return attempts2[i].user; })
      .tickValues(d3.range(attempts2.length));

var formatPercent = d3.format(".0%");
      var	xAxis = d3.svg.axis();
      xAxis
      .orient('bottom')
      .scale(xscale)
      .tickFormat(formatPercent);
      //.tickValues([0].concat(quiz.questions.map(function(d,i){return i +1})));

      var x_xis = canvas.append("g")
      .attr("transform", "translate(149,"+ (HEIGHT + 16) +")")
      .attr("id","xaxis")
      .call(xAxis);

      var y_xis = canvas.append("g")
      .attr("transform", "translate(149,16)")
      .attr("id","yaxis")
      .call(yAxis);

      y_xis.selectAll("text").attr("dy", "1.25em");

      var chart = canvas.append("g")
      .attr("transform", "translate(149.7,0)")
      .attr("id","bars")
      .selectAll("rect")
      .data(attempts2)
      .enter()
      .append("rect")
      .attr("height",19)
      .on("mouseover", function(d){
        d3.select(this).style({fill:d3.rgb(color(d.score/d.max)).darker(0.35)})
      })
      .on("mouseout", function(d){
        d3.select(this).style({fill:color(d.score/d.max)})
      })
      .on("click", function(d) {
        Router.go("/rooms/" + c._id + "/quizzes/" + Session.get("path") + "/attempts/" + d._id)
      }.bind(this))
      .attr({"x":-1,"y":function(d,i){ return yscale(i)+19; }})
      .style('fill',function(d,i){ return color(d.score/d.max); })
      .attr('width',function(d){ return xscale(d.score/d.max); });
	});
});

UI.registerHelper("fillInTheBlanks", function(y, c, b) {
	var i = 0;
	console.log(c, b);
	return "<span class=\"just-text\">" + y.replace(/\[[a-zA-Z,\s\."'\d]+\]/g, function(match) {
		if(c) {
			return "</span><input type=\"text\" class=\"form-control fill-me\"><span class=\"just-text\">";
		} else {
			if(b) {
				if(match.substring(1, match.length-1) === b[i]) {
					return "</span><div class=\"has-success y\"><input type=\"text\" class=\"form-control fill-me\" disabled value=\"" + b[i++] + "\"></div><span class=\"just-text\">";
				} else {
					return "</span><div class=\"has-error y\"><input type=\"text\" class=\"form-control fill-me\" disabled value=\"" + b[i++] + "\"></div><span class=\"just-text\">";
				}
			} else {
				return "</span><input type=\"text\" class=\"form-control fill-me\" disabled><span class=\"just-text\">";
			}
		}
	}) + "</span>";
});
