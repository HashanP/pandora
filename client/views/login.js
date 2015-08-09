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
	"form submit": function(e) {
		e.preventDefault();
		Meteor.loginWithPassword(Template.instance().find(".username").value, Template.instance().find(".password").value);
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

Template["/subjects"].helpers({
	subjects: function() {
		return Rooms.find({type: "subject"}).fetch();
	}
});

Template.notices.onRendered(function() {
/*	var n = function() {
		console.log("hi");
		 $('.slimScrollBar, .slimScrollRail').remove();
		$(".super").slimScroll({
			height:($(window).height() - 76) + "px" 
		});
	};
	n();
	$(window).resize(function() {
		$(".super").unwrap();
		n();
	});
	if(this.data.text) {
		$(".create-text").modal("show")
	}
	$('[data-toggle="popover"]').popover();*/
});

Template.notices.events({
	"input .create-post": function(e) {
		Session.set("post", e.target.value);
	},
	"focus .create-post": function(e) {
		if(Session.get("post") === "") {
			e.target.rows = 3;
			$(e.target).autosize();
			Session.set("isNotEmpty", true);
		}
	},
	"blur .create-post": function(e) {
		console.log($(":focus"));
		if(Session.get("post") === "" && Session.get("modal") !== true) {
			$(e.target).off();
			e.target.style.height = "";
			e.target.rows = 1;
			Session.set("isNotEmpty", false);
		}
	},
	"click .youtube": function(e) {
		Session.set("modal", "true");
	},
	"click .submit": function() {
		Meteor.call("insertPost", this._id, $(".create-post").val());
		$(".create-post").val("").css("height", "").attr("rows", 1);
	},
	"click .del": function() {
		Meteor.call("removePost", Template.instance().data._id, this.noticeId);
	}	
});

Template.notices.helpers({
	"isNotEmpty": function() {
		return Session.get("isNotEmpty");
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

Template.create_quiz.events({
	"click .add-question": function() {
		questions.push({
			title: "",
			help_text: "",
			type: "text",
			possibleTextAnswers: [""]
		});
		Session.set("activeType", "text");
		Session.set("active", questions.length -1);
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
		if(e.target.type === "text") {
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
		$(".question.active .done").trigger("click");
		window.setTimeout(function() {
			if($(".text-danger").length === 0) {
				Modal.show("quizFilename", {_id: Template.instance().data._id});
			}
		});
	}
}); 

Template.createVocabQuiz.events({
	"click .add-question": function() {
		Blaze.render(Template.vocabQuestion, $(".vocab-questions tbody").get(0));
	},
	"click .submit": function() {
		_.each($(".vocab-questions tbody").children(), function(tr) {
			questions.push({
				question: $(tr).find(".vocab-question").val(),
				answer: $(tr).find(".vocab-answer").val()
			});
		});
		Modal.show("quizFilename", {_id: Template.instance().data._id});
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
if (!$(e.srcElement).hasClass("ui-draggable-dragging")) { return; }
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

Template.files.helpers({
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
		swal("Folder name too long", "Folder name cannot be longer than 255 characters");
	} else if(p.indexOf("/") !== -1) {
		swal("Folder name contains /", "Folder names cannot contain forward slashes");
	} else {
		return true;
	} 
};

Template.files.events({
	"click .upload": function() {
		$("tr.active").removeClass("active");
		var y = Template.instance();
		var fileEl = document.createElement("input");
		$("body").append(fileEl);
		fileEl.type = "file";
		fileEl.addEventListener("change", function(e) { 
			FS.Utility.eachFile(e, function(file) {
				file = new FS.File(file);
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
	}
}); 

Template.files.onCreated(function() {
	this.subscribe("files", this.data._id);
});

UI.registerHelper("isNavActive", function(a) {
	return Session.equals("navActive", a);
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
		Meteor.call("insertPost", Template.instance().data._id, $(".text").val(), Array.prototype.slice.call(youtubes.list()), Array.prototype.slice.call(images.list()));
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
