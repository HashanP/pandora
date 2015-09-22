var saveSelection, restoreSelection;

if (window.getSelection && document.createRange) {
    saveSelection = function(containerEl) {
        var range = window.getSelection().getRangeAt(0);
        var preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(containerEl);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        var start = preSelectionRange.toString().length;

        return {
            start: start,
            end: start + range.toString().length
        };
    };

    restoreSelection = function(containerEl, savedSel) {
        var charIndex = 0, range = document.createRange();
        range.setStart(containerEl, 0);
        range.collapse(true);
        var nodeStack = [containerEl], node, foundStart = false, stop = false;

        while (!stop && (node = nodeStack.pop())) {
            if (node.nodeType == 3) {
                var nextCharIndex = charIndex + node.length;
                if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                    range.setStart(node, savedSel.start - charIndex);
                    foundStart = true;
                }
                if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                    range.setEnd(node, savedSel.end - charIndex);
                    stop = true;
                }
                charIndex = nextCharIndex;
            } else {
                var i = node.childNodes.length;
                while (i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }

        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
} else if (document.selection) {
    saveSelection = function(containerEl) {
        var selectedTextRange = document.selection.createRange();
        var preSelectionTextRange = document.body.createTextRange();
        preSelectionTextRange.moveToElementText(containerEl);
        preSelectionTextRange.setEndPoint("EndToStart", selectedTextRange);
        var start = preSelectionTextRange.text.length;

        return {
            start: start,
            end: start + selectedTextRange.text.length
        }
    };

    restoreSelection = function(containerEl, savedSel) {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(containerEl);
        textRange.collapse(true);
        textRange.moveEnd("character", savedSel.end);
        textRange.moveStart("character", savedSel.start);
        textRange.select();
    };
}

Template.login.events({
	"click .login-button": function(e) {
		Meteor.loginWithPassword(Template.instance().find(".username").value, Template.instance().find(".password").value, function(err) {
			console.log(err);
		});
	 } 
}); 

Template.base.onRendered(function() {
	var tmp = Template.instance();
	Tracker.autorun(function() {
		tmp.$(".sidebar li").removeClass("active");
		tmp.$(".sidebar li").each(function(index, li) {
			if(wnd.get().pathname.indexOf($(li).find("a").attr("href")) === 0) {
				$(li).addClass("active");
			}
		});
	});
});

Template.base.helpers({
	subjects: function() {
		return Rooms.find({type: "subject"}).fetch();
	}
});

Template.navbar.helpers({
	username: function() {
		return Meteor.user().username;
	},
	navbarActive: function() {
		return Session.get("navbarActive");
	}
});

Template.navbar.events({
	"click .logout": function() {
		Meteor.logout();
	}
});

Template.adminNav.helpers({
	adminActive: function() {
		return Session.get("adminActive");
	}
});

Template.settings.events({
	"click .change-password": function() {
		if($(".new-password").val() === "") {
			Session.set("error", "New password cannot be blank.");
		} else if($(".new-password").val() !== $(".confirm-password").val()) {
			Session.set("error", "New password and confirm new password are not the same.");	
		} else {
			Accounts.changePassword($(".current-password").val(), $(".confirm-password").val(), function(err) {
				if(err) {
					Session.set("error", err.reason + ".");
				} else {
					$(".new-password").val("");
					$(".confirm-password").val("");
					$(".current-password").val("");
					Session.set("success", "Your password has been changed.");
				}
			});
		}
	}
});

Template.settings.helpers({
	error: function() {
		return Session.get("error");
	},
	success: function() {
		return Session.get("success");
	}
});

Template.navigation.onCreated(function() {
	this.subscribe("notices", this.data._id);
});

Template.notices.events({
	"click .del": function() {
		if(this.type === "notice") {
			Notices.remove(this._id);
		} else if(this.type === "poll") {
			Polls.remove(this._id);
		} else if(this.type === "reminder") {
			Reminders.remove(this._id);
		} else {
			Assignments.remove(this._id);
		}
	},
	"click .reply": function() {
		Session.set("activeNotice", this._id);
		window.setTimeout(function() {
			$("textarea").autosize();
		}, 0);
	},
	"click .submit-reply": function() {
		Meteor.call("reply", Template.instance().data._id, this._id, this.type, $(".reply-text").val());
		Session.set("activeNotice", undefined);
	},
	"click .show-all": function() {
		Session.set("showAll", !Session.get("showAll"));
	},
	"click .cancel-reply": function() {
		Session.set("activeNotice", undefined);
	},
	"click .del-reply": function(e) {
		console.log(e.target.dataset);
		Meteor.call("delComment", e.target.dataset.id, e.target.dataset.type, this.commentId);
	},
	"click .edit-reply": function(e) {
		Session.set("activeComment", {
			type: e.target.dataset.type,
			_id: e.target.dataset.id,
			id: this.commentId
		});
		window.setTimeout(function() {
			$(".edit-reply-field").focus();
		}, 0);
	},
	"click .hand-in": function(e) {
		var y = Template.instance();
		var c = this;
		var fileEl = document.createElement("input");
		$("body").append(fileEl);
		fileEl.type = "file";
		fileEl.addEventListener("change", function(e) { 
		FS.Utility.eachFile(e, function(file) {
			file = new FS.File(file);
			file.owner = y.data._id;
			file.schoolId = y.data.schoolId;
			file.category = "upload";
			file.userId = Meteor.userId();
			file.assignmentId = c._id;
			Files.insert(file, function(err, fileObj) {
				var files = Session.get("filesBeingUploaded");
				files.push(fileObj._id);
					Session.set("filesBeingUploaded", files);
				});
			});
			$(fileEl).remove();
		});	
		fileEl.click();
	},
	"blur .edit-reply-field": function() {
		var c = Session.get("activeComment");
		Meteor.call("editReply", c.type, c._id, c.id, $(".edit-reply-field").val());
		Session.set("activeComment", "");
	},
	"click .poll-submit": function(e) {
		console.log(this);
		var x = $(e.target).closest(".poll").find("input:checked");
		if(x.length === 0) {
			swal("You must select an option.");
		} else {
			Meteor.call("vote", this._id, $(e.target).closest(".poll").find("input:checked").val());
		}
	}
});

Template.assignment.onCreated(function() {
	this.subscribe("fa", this.data.assignmentId);
});

Template.home.helpers({
	joined: function(id) {
		return Rooms.findOne(id).students.indexOf(Meteor.userId()) !== -1;
	},
	teacher: function(id) {
		return Rooms.findOne(id).teachers.indexOf(Meteor.userId()) !== -1;
	}
});

Template.home.events({
	"click .join": function() {
		Meteor.call("join", this._id);
	},
	"click .unjoin": function() {
		Meteor.call("unjoin", this._id);
	}
});

Template.assignment.helpers({
	uploads: function() {
		return Assignments.findOne(Template.instance().data.assignmentId).uploads;
	},
	feedback: function() {
		return this.grade !== undefined || this.comment !== undefined;
	}
});

Template.assignment.events({
	"click .open-feedback": function() {
		Modal.show("feedback", {grade: this.grade, comment: this.comment, userId: this.userId, assignmentId: Template.instance().data.assignmentId});
	}
});

Template.feedback.events({
	"click .save": function() {
		Meteor.call("feedback", Template.instance().data.assignmentId, Template.instance().data.userId, $(".grade").val(), $(".comment").val());
		Modal.hide("feedback");
	}
});

Template.notices.helpers({
	"isNotEmpty": function() {
		return Session.get("isNotEmpty");
	},
	activeNotice: function() {
		return Session.get("activeNotice");
	},
	"username": function(userId) {
		return Meteor.users.findOne(userId).username;
	},
	tooManyComments: function() {
		return this.comments.length > 3;
	},
	showAll: function() {
		return Session.get("showAll");
	},
	commentsF: function() {
		return Session.get("showAll") || this.comments.length < 3 ? this.comments : this.comments.slice(this.comments.length-3);
	},
	notices: function() {
		return _.sortBy(Notices.find().fetch().concat(Polls.find().fetch()).concat(Assignments.find().fetch()).concat(Reminders.find().fetch()), "date").reverse();
	},
	notDone: function() {
		return Rooms.findOne(Template.instance().data._id).students.length - this.uploads.length;
	},
	fff: function() {
		var t = _.findWhere(this.uploads, {userId: Meteor.userId()});
		console.log(t);
		if(t === undefined) {
			return {files: []};
		} else {
			return t;
		}
	},
	activeComment: function(x, z, y) {
		var pp = Session.get("activeComment");
		return pp.type === x && pp._id === z && pp.id === y;
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

Template.createPoll.events({
	"click .add-option": function(e) {
		Blaze.render(Template.pollOption, e.target.parentNode.parentNode, e.target.parentNode, Template.instance()); 
	},
	"click .remove-option": function(e) {
		$(e.target).closest(".option").remove();
	},
	"click .submit": function() {
		var title = $(".text").val();
		var p = _.map($(".option input"), function(el) {
			return $(el).val();
		});
		if(title === "") {
			return Session.set("error", "Title cannot be empty.");
		} else if(title.length > 400) {
			return Session.set("error", "Title cannot be longer than 400 characters.");
		}
		if(p.length < 2) {
			return Session.set("error", "There must be at least 2 options.");
		} else if(p.length > 10) {
			return Session.set("error", "There cannot be more than 10 options.");
		}
		for(var i = 0; i < p.length; i++) {
			if(p[i].trim() === "") {
				return Session.set("error", "Options cannot be empty.");
			} else if(p[i].length > 100) {
				return Session.set("error", "Options cannot be longer than 100 characters.");
			}
		}
		var t = p.map(function(x) {
			return {title: x, votes:0};
		});
		Polls.insert({
			text: title,
			date: new Date(Date.now()),
			comments: [],
			allowComments: true,
			pollOptions: t,
			roomId: Template.instance().data._id,
			userId: Meteor.userId(),
			voted: []
		});		
		Router.go("/rooms/" + Template.instance().data._id);
	}
});

Template.createPoll.helpers({
	error: function() {
		return Session.get("error");
	}
});

Template.createReminder.events({
	"click .submit": function() {
		if($(".text").val() === "") {
			return Session.set("error", "Event name cannot be empty.");
		} else if($(".text").val().length > 200) {
			return Session.set("error", "Event name cannot be longer than 200 characters.");
		} else if($(".eventDate").val() === "") {
			return Session.set("error", "Event date cannot be empty.");
		}
		if(!Template.instance().data.reminderId) {
			Reminders.insert({
				date: new Date(Date.now()),
				eventDate: new Date($(".eventDate").val()),
				text: $(".text").val(),
				comments: [],
				allowComments: true,
				roomId: Template.instance().data._id,
				userId: Meteor.userId()	
			});
		} else {
			Reminders.update(Template.instance().data.reminderId, {
				$set: {
					eventDate: new Date($(".eventDate").val()),
					text: $(".text").val()
				}
			});
		}
		Router.go("/rooms/" + Template.instance().data._id);
	}
});

Template.createAssignment.helpers({
	error: function() {
		return Session.get("error");
	},
	obj: function() {
		return Assignments.findOne(Template.instance().data.assignmentId);
	}
});

Template.createReminder.helpers({
	error: function() {
		return Session.get("error");
	},
	obj: function() {
		if(Template.instance().data.reminderId) {
			return Reminders.findOne(Template.instance().data.reminderId);
		}
	}
});

Template.createAssignment.events({
	"click .submit": function() {
		if($(".text").val() === "") {
			return Session.set("error", "Details cannot be empty.");
		} else if($(".text").val().length > 4000) {
			return Session.set("error", "Details cannot be longer than 4000 characters.");		
		} else if($(".dueDate").val() === "") {
			return Session.set("error", "Due date cannot be empty.");
		}
		if(!Template.instance().data.assignmentId) {
			Assignments.insert({
				text: $(".text").val(),
				comments: [],
				allowComments: true,
				roomId: Template.instance().data._id,
				userId: Meteor.userId(),
				deadline: new Date($(".dueDate").val()),
				date: new Date(Date.now()),
				uploads: [],
				uploadViaPandora: $(".uploadViaPandora").is(":checked")
			});		
		} else {
			var obj = {
				text: $(".text").val(),
				deadline: new Date($(".dueDate").val()),
				uploadViaPandora: $(".uploadViaPandora").is(":checked")
			};
			Assignments.update(Template.instance().data.assignmentId, {
				$set: obj
			});
		}
		Router.go("/rooms/" + Template.instance().data._id);
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

var search = function(folder, searc) {
	var results = [];
	folder.forEach(function(n) {
		if(n.type === "file") {
			var p = Files.findOne(n._id);
			if(p && p.name().match(new RegExp(searc, "i"))) {
				results.push(n);
			} 
		} else {
			results = results.concat(search(n.files, searc));
		}
	});
	return results;
};

var getFiles = function() {
	if(!Session.get("search")) {
		return _.sortBy(Session.get("files"), "name");
	} else {
		return _.sortBy(search(Session.get("files"), Session.get("search")), "name");
	}
}

Template.explorer.helpers({
	newFolder: function() {
		return Session.get("newFolder");
	},
	filesF: function() {
		if(!Session.get("search")) {
			return _.sortBy(Template.instance().data.files, "name");
		} else {
			return _.sortBy(search(Template.instance().data.files, Session.get("search")), "name");
		}
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
	error: function() {
		return Session.get("error");
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
				y.answer = _.map($(el).find("input"), function(d) {
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
		return this.correct ? "has-success" : "has-danger";
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
		console.log(attempts);
		console.log(attemptsObj);
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
		console.log(attempts2);
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

      var x_xis = canvas.append('g')
      .attr("transform", "translate(149,"+ (HEIGHT + 16) +")")
      .attr('id','xaxis')
      .call(xAxis);

      var y_xis = canvas.append('g')
      .attr("transform", "translate(149,16)")
      .attr('id','yaxis')
      .call(yAxis);

      y_xis.selectAll("text").attr("dy", "1.25em");

      var chart = canvas.append('g')
      .attr("transform", "translate(149.7,0)")
      .attr('id','bars')
      .selectAll('rect')
      .data(attempts2)
      .enter()
      .append('rect')
      .attr('height',19)
      .on('mouseover', function(d){
        d3.select(this).style({fill:d3.rgb(color(d.score/d.max)).darker(0.35)})
      })
      .on('mouseout', function(d){
        d3.select(this).style({fill:color(d.score/d.max)})
      })
      .on('click', function(d) {
        Router.go("/rooms/" + c._id + "/quizzes/" + Session.get("path") + "/attempts/" + d._id)
      }.bind(this))
      .attr({'x':0,'y':function(d,i){ return yscale(i)+19; }})
      .style('fill',function(d,i){ return color(d.score/d.max); })
      .attr('width',function(d){ return xscale(d.score/d.max); });
	});
});

UI.registerHelper("fillInTheBlanks", function(y, c) {
	return "<span class=\"just-text\">" + y.replace(/\[[a-zA-Z,\s\."'\d]+\]/g, function(match) {
		if(c) {
			return "</span><input type=\"text\" class=\"form-control fill-me\"><span class=\"just-text\">";
		} else {
			return "</span><input type=\"text\" class=\"form-control fill-me\" disabled><span class=\"just-text\">";
		}
	}) + "</span>";
});

Template.noticeNav.helpers({
	events: function() {
		return _.sortBy(Reminders.find({roomId: Template.currentData()._id}).fetch().concat(Assignments.find({roomId: Template.currentData()._id}).fetch()), function(x) {
			return x.type === "reminder" ? x.eventDate : x.deadline;
		});
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
		Session.set("activeType", "text");
		Session.set("active", questions.length -1);
		Session.set("activeAnswer", questions.list()[Session.get("active")]);
		$(".add-question").attr("disabled", true);
	},
	"click .done": function() {
		var p = {
			title: $(".question-title").val(),
			help_text: $(".help-text").val(),
			type: $(".type").val(),
		};
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
		if(p.title === "") {
			return Session.set("error", "Question title cannot be blank.");
		} else if((p.options && p.options.length === 0) || (p.possibleTextAnswers && p.possibleTextAnswers.length === 0) || 
			(p.possibleNumberAnswers && p.possibleNumberAnswers.length === 0)) {
			return Session.set("error", "There must be at least one correct answer.");
		} else if((p.options && p.options.length > 20) || (p.possibleTextAnswers && p.possibleTextAnswers.length > 20) || 
			(p.possibleNumberAnswers && p.possibleNumberAnswers.length > 20)) {
			return Session.set("error", "There cannot be more than 20 correct answers.");	
		} else if(p.title.length > 200) {
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
		console.log($(".question-title").val());
		questions.splice(this.index, 1, p);
		Session.set("active", undefined);
		Session.set("error", undefined);
		$(".add-question").attr("disabled", false);
	},
	"click .edit": function() {
		Session.set("active", this.index);
		Session.set("activeType", window.questions.list()[this.index].type);
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
		/*if(e.target.type === "text") {
			Session.set("options", [""]);
		} else if(e.target.type === "number") {
			Session.set("options", [0]);
		} else if(e.target.type === "list") {
			Session.set("options", [{
				value: "",
				active: true	
			}]);
		} else if(e.target.type === "checkboxes") {
			Session.set("options", [{
				value: ""
			}]);
		}*/
/*		window.setTimeout(function() {
			$(".add-option").trigger("click");
		}, 0);*/
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
		if(Router.current().params.query.create === "quiz") {
			Meteor.call("createQuiz", Template.instance().data._id, Session.get("path"), $(".quiz-title").val(), Array.prototype.slice.call(questions.list()));	
		} else {
			Meteor.call("createVocabQuiz", Template.instance().data._id, Session.get("path"), $(".quiz-title").val(), Array.prototype.slice.call(questions.list()));		
		}
		Modal.hide("quizFilename");
		Router.go("/rooms/" + Template.instance().data._id + "/quizzes" + (Session.get("path") === "/" ? "/" : "/" + Session.get("path")));
	}
});

Template.vocabQuiz.onCreated(function()	{
	console.log(this.data);
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

Template.search.helpers({
	search: function() {
		return Session.get("search");
	}
});

Template.search.events({
	"keyup .search": function() {
		var y =	Template.instance().$(".search").val();
		if(y === "") {
			Router.go("/rooms/" + Template.instance().data._id + "/files");
		} else {
			Router.go("/rooms/" + Template.instance().data._id + "/files?search=" + Template.instance().$(".search").val());
		}
	}
});

Template.tools.helpers({
	noOfActive: function() {
		return Session.get("noOfActive");
	}
});

Template.tools.events({
	"click .rename": function() {
		var x = $("tr.active .filename").text().trim(); 
		Session.set("old", x);
		Session.set("active", x);
		window.setTimeout(function() {
			$(".input-rename").val(x).focus();
			$(".input-rename").get(0).selectionStart = 0;
			$(".input-rename").get(0).selectionEnd = x.length;
		}, 0);
	},
	"click .del": function(e) {
		e.stopPropagation();
		var n = _.map($("tr.active"), function(e) {
			return $(e).find(".filename").text().trim();
		});
		var y = Template.instance();
		swal({
			title: "Are you sure?",
			showCancelButton: true,
			confirmButtonClass: "btn-danger",
			confirmButtonText: $("tr.active").length === 1 ? "Yes, delete it!" : "Yes, delete them!",
			closeOnConfirm: true
		},
		function(isConfirm){
			if(isConfirm) {
				n.forEach(function(b) {
					console.log(b);
					Meteor.call("delFolder", y.data._id, Session.get("navActive"), Session.get("path"), b);
				});
			}
		});
	},
	"click .create-folder": function() {
		Session.set("newFolder", true);
		window.setTimeout(function() {
			$(".input-create-folder").focus();
		}, 0);
	}
});

Template.explorer.events({
	"click tbody tr": function(e) {
		if($(e.target).is("input")) {
			return true;
		}
		e.stopPropagation();
		document.getSelection().removeAllRanges();
		if(!(e.ctrlKey || e.metaKey || e.shiftKey)) {
			$(e.target).closest("tr").siblings().removeClass("active");
		}
		if(e.shiftKey) {
			var sep = $(e.target).closest("tr");
			var pre = $(e.target).closest("tr").prevAll(".active");
			var nex = $(e.target).closest("tr").nextAll(".active");
			console.log(sep.prevAll(".active"));
			console.log(sep.nextAll(".active"));
			if(!(pre.length === 0 && nex.length === 0)) {
				console.log("here");
				if(pre.length !== 0 && nex.length !== 0) {
					if((sep.index() - pre.index()) >= (nex.index() - sep.index())) {
						sep.nextUntil(nex).addClass("active");
					} else {
						pre.nextUntil(sep).addClass("active");	
					}
				} else {
					if(pre.length === 0) {
						sep.nextUntil(nex).addClass("active");
					} else {
						pre.nextUntil(sep).addClass("active");
					}
				}
			}
		}
		$(e.target).closest("tr").addClass("active");
		$(".circle").text($("tr.active").length);
		Session.set("noOfActive", $("tr.active").length);
	},
	"dragstart tr": function(e) {
		if(!$(e.target).is(".active")) {
			$(e.target).closest("tr").siblings().removeClass("active");
			$(e.target).addClass("active");	
		}
		$(".circle").text($("tr.active").length);
		Session.set("noOfActive", $("tr.active").length);
	},
	"drop tr.folder": function(e, ui) {
/*if (!$(e.srcElement).hasClass("ui-draggable-dragging")) { return; }*/
		e.preventDefault();
		if(!$(e.target).is(".active")) {
			Meteor.call("drop", Template.instance().data._id, Session.get("navActive"), Session.get("path"), $(e.target).find(".filename").text(), _.map($("tr.active"), function(el) {
				return $(el).find(".filename").text().trim();
			}));
		}
	},
	"dblclick tbody tr": function(e) {
		if($(e.target).is("input")) {
			return;
		}
		if(this.type === "file") {
			var a = document.createElement("a");
			a.href = Files.findOne(this._id).url();
			a.click();
		} else if(this.type === "link") {
			var a = document.createElement("a");
			a.href = this.url;
			a.click();
		} else {
			$("tr.active").removeClass("active");
			Router.go("/rooms/" + Template.instance().data._id + "/" + Session.get("navActive") + (Session.get("path") === "/" ? "/" : "/" + Session.get("path") + "/") + this.name);
		}
	},
	"mousedown tr": function(e) {
		e.preventDefault();
	},
	"click .cancel-create": function() {
		Session.set("newFolder", false);
	},
	"blur .input-create-folder": function() {
		var p = Template.instance().$(".input-create-folder").val();
		if(p !== "") {
			if(nameValidation(p)) {
				Meteor.call("createFolder", Template.instance().data._id, Session.get("navActive"), Session.get("path"), p);
			}
		}
		Session.set("newFolder", false);
	},
	"keyup .input-create-folder, keyup .input-rename": function(e) {
		if(e.keyCode === 13) {
			$(e.target).trigger("blur");
		}
	},
	"blur .input-rename": function() {
		var p = $(".input-rename").val();
		if(p !== "") {
			if(nameValidation(p)) {
				Meteor.call("fileRename", Template.instance().data._id, Session.get("navActive"), Session.get("path"), Session.get("old"), p);	
			}
		}
		Session.set("active", undefined);
	}
});

Template.uploadStatus.helpers({
	filesBeingUploaded: function() {
		return Session.get("filesBeingUploaded");
	},
	finished: function() {
		var files = Session.get("filesBeingUploaded");
		for(var i = 0; i < files.length; i++) {
			var f = Files.findOne(files[i]);
			if(!f || !f.isUploaded()) {
				return false;
			}
		}
		return true;
	},
	errors: function() {
		return Session.get("errors");
	},
	show: function() {
		return Session.get("errors").length || Session.get("filesBeingUploaded").length;
	}
});

Template.files.helpers({
	path: function() {
		var x = Session.get("path");
		if(x !== "/") {
			return "/" + x + "/";
		} else {
			return x;
		}
	}
});

Template.breadcrumb.helpers({
	pathSplit: function() {
		var x = Session.get("path").split("/");
		if(Session.equals("navActive", "files")) {
			var results = [{name: "Files", p: ""}];
		} else {
			var results = [{name: "Quizzes", p:""}];
		}
		if(Session.get("path") !== "/") {
			var current = "";
			x.forEach(function(folder) {
				current += "/" + folder;
				results.push({
					name: folder,
					p: current,
					active: false	
				});
			});
		}
		results[results.length-1].active = true;
		return results;
	},
	navActive: function() {
		return Session.get("navActive");
	}	
});

Template.item.helpers({
	isFolder: function() {
		return this.type === "folder";
	},
	isActive: function(a) {
			console.log(a);
			return Session.equals("active", a);
	}
});

var c = function() {
	$("tr.active").removeClass("active");
	Session.set("noOfActive", 0);
};

Template.explorer.onRendered(function() {
	$("body").on("click", c);
});
	
Template.item.onRendered(function() {
	Template.instance().$("tr").draggable({
		helper: function() {
			return $(".circle").clone().show();
		},
		cursorAt: {
			top: -23,
			left: -23
		},
		containment: ".contents",
		distance: 10
	});
	Template.instance().$("tr.folder").droppable({
		hoverClass:"ui-hover",
		tolerance: "pointer"
	});
});

Template.explorer.onDestroyed(function() {
	$("body").unbind("click", c);
});

var nameValidation = function(p) {
	if(p.length > 255) {
		swal("Name too long", "File and folder names cannot be longer than 255 characters");
	} else if(p.indexOf("/") !== -1) {
		swal("Name contains /", "Folder names cannot contain forward slashes");
	} else if(_.findWhere(getFiles(), {name: p})) {
		swal("Another file or folder has the same name", "Please choose a different name");	
	} else {
		return true;
	} 
};

Template.files.events({
	"click .upload": function() {
		$("tr.active").removeClass("active");
		var y = Template.instance();
		console.log(y);
		var fileEl = document.createElement("input");
		fileEl.multiple = true;
		$("body").append(fileEl);
		fileEl.type = "file";
		Session.set("errors", []);
		fileEl.addEventListener("change", function(e) { 
			FS.Utility.eachFile(e, function(file) {
				file = new FS.File(file);
				if(_.findWhere(getFiles(), {name: file.name(), type: "folder"})) {
					console.log("here");
					var errors = Session.get("errors");
					errors.push({name:file.name()});
					return Session.set("errors", errors);
				}
				file.owner = y.data._id;
				file.schoolId = y.data.schoolId;
				file.category = "resource";
				file.path = Session.get("path");
				Files.insert(file, function(err, fileObj) {
					var files = Session.get("filesBeingUploaded");
					files.push(fileObj._id);
					Session.set("filesBeingUploaded", files);
				});
			});
			$(fileEl).remove();
		});	
		fileEl.click();
	},
	"click .done": function() {
		Session.set("filesBeingUploaded", []);
		Session.set("errors", []);
	},
	"click .add-link": function() {
		Modal.show("newLink", Template.instance().data);
	}
}); 

Template.newLink.events({
	"click .submit": function() {
		var url = $(".url").val();
		if (!/^https?:\/\//i.test(url)) {
			url = 'http://' + url;
		}
		Meteor.call("addLink", Template.instance().data._id, Session.get("path"), {
			name: $(".name").val(),
			url: url
		});
		Modal.hide("addLink");
	}
});

Template.files.onCreated(function() {
	this.subscribe("files", this.data._id);
});

Template.notices.onCreated(function() {
	this.subscribe("noticeFiles", this.data._id);
});

UI.registerHelper("isNavActive", function(a) {
	return Session.equals("navActive", a);
});

Template["/announcement"].onCreated(function() {
	window.images = new ReactiveArray();	
	window.youtubes = new ReactiveArray();
	var data = this.data;
	if(data.announcementId) {
		this.autorun(function() {
			var announcement = Notices.findOne(data.announcementId)
			if(announcement) {
				announcement.images.forEach(function(x) {
					images.push(x);
				});
				announcement.youtubes.forEach(function(x) {
					youtubes.push(x);
				});
			}
		});
	}
});

Template["/announcement"].onRendered(function() {
	Template.instance().$(".text").autosize();
});

Template["/announcement"].events({
	"click .add-image": function(e) {
		console.log(e.target);
		$(e.target).blur();
		var fileEl = document.createElement("input");
    fileEl.type = "file";
		fileEl.accept = "image/*";
    fileEl.addEventListener("change", function() {
			if(fileEl.files[0].size < 3 * 1024 * 1024) {	
				var reader = new FileReader();
				reader.addEventListener("load", function(e) {
					images.push({
						data: e.target.result,
						title: fileEl.files[0].name
					}); 
				}.bind(this));
				reader.readAsDataURL(fileEl.files[0]);
			} else {
				Modal.show("fileSizeTooBig");
			}
		}.bind(this)); 
		fileEl.click();
	},
	"click .add-youtube": function(e) {
		console.log(e.target);
		$(e.target).blur();
		var id = Iron.Url.parse($(".youtube-url").val()).queryObject.v;
		$.getJSON("https://noembed.com/embed?url=http%3A//www.youtube.com/watch%3Fv%3D" + id + "&callback=?", function(result) {
			var title = result.title;
			youtubes.push({
				id: id,
				title: title
			});
		});
		$("#youtube").modal("hide");
		$(".youtube-url").val("");
	},
	"click .remove-youtube": function() {
		youtubes.splice(this.index, 1);
	},
	"click .submit": function() {
		var text = $(".text").val();
		if(text === "" && youtubes.length === 0 && images.length === 0) {
			return Session.set("error", "Post cannot contain nothing.");
		} else if(text.length > 4000) {
			return Session.set("error", "Post cannot be longer than 4000 characters.");
		}
		if(!Template.instance().data.announcementId) {
			Notices.insert({
				text: text,
				date: new Date(Date.now()),
				roomId: Template.instance().data._id,
				allowComments: true,
				comments: [],
				youtubes: Array.prototype.slice.call(youtubes.list()),
				images: Array.prototype.slice.call(images.list()),
				userId: Meteor.userId()
			});
		} else {
			Notices.update(Template.instance().data.announcementId, {$set: {
				text: text,
				youtubes: Array.prototype.slice.call(youtubes.list()),
				images: Array.prototype.slice.call(images.list())
			}});
		}
		Router.go("/rooms/" + Template.instance().data._id);
	}
});

Template["/announcement"].helpers({
	"images": function() {
		return images.list();
	},
	youtubes: function() {
		return youtubes.list();
	},
	error: function() {
		return Session.get("error");
	},
	value: function() {
		console.log(Notices.findOne(Template.instance().data.announcementId));
		if(Template.instance().data.announcementId) {
			return Notices.findOne(Template.instance().data.announcementId).text;
		}	
	}
});

Template.youtubeList.helpers({
	youtubeId: function() {
		return Session.get("youtubeId");
	}, 
	youtubeTitle: function() {
		return Session.get("youtubeTitle");
	}
});

Template.youtubeList.events({
	"click .show-youtube": function() {
		Session.set("youtubeId", this.id);
		Session.set("youtubeTitle", this.title);
		$("#show-youtube").modal("show");
	},
	"hide.bs.modal #show-youtube": function() {
		Session.set("youtubeId", "");
	}
});

Template.imageList.helpers({
	imageSrc: function() {
		return Session.get("imageSrc");
	},
	imageTitle: function() {
		return Session.get("imageTitle");
	}
});

Template.imageList.events({
	"click .remove-image": function() {
		images.splice(this.index, 1);
	},
	"click .show-image": function() {
		Session.set("imageSrc", this.data);
		Session.set("imageTitle", this.title);
		$("#show-image").modal("show");
	}
});

Template.createVocabQuiz.onRendered(function() {
	$(".vocab-questions tbody").sortable({
		handle:".move",
		cancel:""
	});
});

Template.vocabQuiz.events({
  "keyup input.answer": function(e) {
    console.log("here");
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
