Template.login.events({
  "submit .login-form": function(e) {
    var username = e.target.username.value;
    var password = e.target.password.value;

    Meteor.loginWithPassword(username, password, function(err){
      if(err) {
        Session.set("err", "Your username or password is incorrect.");
      } else {
        Session.set("err", "");
      }
    });

    return false;
  }
});

Template.navbar.helpers({
  "username":function() {
    if(Meteor.user()) {
      console.log(Meteor.user());
      return Meteor.user().emails[0].address.split("@")[0];
    }
  },
  "admin": isAdmin
});

Template.course.helpers({
  "teacher": function() {
    return isAdmin() || this.doc && this.doc.teachers && this.doc.teachers.indexOf(Meteor.userId()) !== -1;
  }
});

Template.subjects.created = function() {
  Session.set("grid", true);
}

Template.subjects.helpers({
  "needTitle": function() {
    return _.uniq(_.pluck(Template.instance().data.courses, "icon")).length !== _.pluck(Template.instance().data.courses, "icon").length;
  },
  "grid": function() {
    return Session.get("grid");
  }
});

Template.subjects.events({
  "click .btn": function(e) {
    Session.set("grid", e.target.value === "grid");
  }
});

Template.post.helpers({
  "teacher": function() {
    console.log(this.doc);
    return  (this.doc && this.doc.teachers && this.doc.teachers.indexOf(Meteor.userId()) !== -1)
    || (Meteor.user() && Meteor.user().roles.indexOf("admin") !== -1);
  }
});

Template.vocabularyQuiz.helpers({
  "teacher": function() {
    console.log(this.doc);
    return  (this.doc && this.doc.teachers && this.doc.teachers.indexOf(Meteor.userId()) !== -1)
    || (Meteor.user() && Meteor.user().roles.indexOf("admin") !== -1);
  }
});

Template.quiz.helpers({
  "teacher": function() {
    console.log(this.doc);
    return  (this.doc && this.doc.teachers && this.doc.teachers.indexOf(Meteor.userId()) !== -1)
    || (Meteor.user() && Meteor.user().roles.indexOf("admin") !== -1);
  }
});

Template.post.helpers({
  "id": function() {
    return this.post.content.split("?v=")[1];
  }
});

Template.post.events({
  "click .del": function() {
    Meteor.call("removePost", this.doc._id, this.post.postId);
    Router.go("/courses/" + this.doc._id +"/blog");
  }
});

Template.insertPost.helpers({
  "schema": function() {
    return Schemas.Post;
  },
  "type": function() {
    return Session.get("type");
  }
});

Template.insertPost.events({
  "change #options": function(e) {
    Session.set("type", e.target.value);
  },
  "submit form": function(e) {
    Meteor.call("post", this._id || this.doc._id, {
      title: e.target.title.value,
      type: e.target.type.value,
      content: (e.target.type.value === "rich" ? $("#editor").val() : e.target.content.value)
    }, (this.post ? this.post.postId : undefined))
    Router.go("/courses/" + (this._id || this.doc._id)+ "/blog" + (this.post ? "/" + this.post.postId : ""));
    return false;
  },
  "DOMNodeInserted": function(e) {
    if(e.target.classList.contains("form-group")) {
      $("#editor").wysihtml5();
    }
  }
});

Template.vocabularyQuestion.events({
  "click .del": function() {
    Blaze.remove(Blaze.currentView);
  }
});

Template.optionForm.events({
  "click .del": function() {
    Blaze.remove(Blaze.currentView);
    return false;
  }
});

Template.questionForm.helpers({
  "type": function() {
    return Session.get("type")[this.no];
  }
});

Template.questionForm.events({
  "change .type": function(e) {
    var y = Session.get("type")
    y[this.question.no] = e.target.value;
    Session.set("type", y);
  },
  "click .del": function() {
    Blaze.remove(Blaze.currentView);
  }
});

Template.optionForm.helpers({
  "type": function() {
    return Session.get("type")[this.no];
  }
});

var addVocabularyQuestion = function(el, data) {
  Blaze.renderWithData(Template.vocabularyQuestion, data || {}, el, el.lastElementChild);
};

Template.insertVocabularyQuiz.helpers({
  "titleError": function() {
    return Session.get("titleError");
  }
});

Template.insertVocabularyQuiz.events({
  "click .addQuestion": function(e) {
    addVocabularyQuestion(e.target.parentNode.parentNode.parentNode);
  },
  "submit form": function(e) {
    var data = {title:e.target.title.value, format:e.target.format.value, questions:[]};
    if(!data.title) {
      Session.set("titleError", "Title cannot be empty.");
      return false;
    } else {
      Session.set("titleError", "");
    }
    var el = $(e.target);
    el.find(".question").each(function(i, el) {
      data.questions.push({
        question:$(el).find(".part-q").val(),
        answer:$(el).find(".part-a").val()
      })
    });
    Meteor.call("vocabularyQuiz", this.doc._id, data, (this.quiz ? this.quiz._id : undefined));
    Router.go("/courses/" + this.doc._id + "/vocabularyQuizzes" + (this.quiz ? "/" + this.quiz._id : ""));
    return false;
  },
  "click .import": function() {
    var y= Template.instance();
    var fileEl = document.createElement("input");
    fileEl.type = "file";
    fileEl.addEventListener("change", function() {
      var reader = new FileReader();
      reader.addEventListener("load", function(e) {
        var n = new DOMParser();
        var doc = n.parseFromString(e.target.result, "text/xml");
        Array.prototype.slice.call(doc.querySelectorAll("clues item")).forEach(function(el) {
          addVocabularyQuestion(y.find(".questions"), {
            question: el.querySelector("def").childNodes[0].nodeValue,
            answer: el.querySelector("word").childNodes[0].nodeValue
          })
        });
      }.bind(this));
      reader.readAsText(fileEl.files[0]);
    }.bind(this));
    fileEl.click();

  }
});

Template.accents.events({
  "click .accent":function(e) {
    var focus = $(lastActive);
    var start = lastActive.selectionStart, end = lastActive.selectionEnd;
    focus.val(focus.val().substring(0, start) + $(e.target).text() + focus.val().slice(end));
    lastActive.focus();
    lastActive.setSelectionRange(start+1, start + 2);
  }
});

Template.fileUpload.helpers({
  finished: function() {
    for(var i = 0; i < this.files.length; i++) {
      var s = Files.findOne(this.files[i]);
      if(!s || !s.isUploaded()) {
        return false;
      }
    }
    return true;
  }
});

Template.studentResources.events({
  "click .del": function(e) {
    Files.remove(this._id);
  }
});

Template.fileUpload.rendered = function() {
  $(".modal").modal("show");
  $(".modal").on('hidden.bs.modal', function() {
    $(this).remove();
  });
}

Template.course.events({
  "click .uploadFile": function() {
    var fileEl = document.createElement("input");
    $("body").append(fileEl);
    fileEl.type = "file";
    fileEl.addEventListener("change", function(e) {
      var files = new ReactiveVar([]);
      Blaze.renderWithData(Template.fileUpload, function() {
        console.log(files.get());
        return {files:files.get()};
      }, document.body);
      FS.Utility.eachFile(event, function(file) {
        file = new FS.File(file);
        file.owner = this.doc._id;
        file.category = "studentResource";
        Files.insert(file, function(err, fileObj) {
          var f = files.get();
          f.push(fileObj._id);
          files.set(f);
        }.bind(this));
      }.bind(this));
      $(fileEl).remove();
    }.bind(this));
    fileEl.click();
    return false;
  },
  "click .abort": function() {
    FS.HTTP.uploadQueue.cancel();
  }
});

Template.insertVocabularyQuiz.rendered = function() {
  var data = Template.currentData();
  if(data.quiz) {
    data.quiz.questions.forEach(function(question) {
      addVocabularyQuestion(Template.instance().find(".questions"), question);
    });
  } else {
    addVocabularyQuestion(Template.instance().find(".questions"));
  }
  var sort = new Sortable(this.find(".questions"), {
    animation: 150, // ms, animation speed moving items when sorting, `0` — without animation
    handle: ".handle", // Restricts sort start click/touch to the specified element
    draggable: ".question",
    ghostClass:"ghost"
  });
}

var addOption = function(el, data) {
  if(!data) {
    data = {};
  }
  data.no = Template.currentData().no || Template.currentData().question.no;
  Blaze.renderWithData(Template.optionForm, data, el, el.querySelector(".btn"));
}

var count = 0;
var addQuestion = function(el, data) {
  if(!data) {
    data = {};
  }
  data.no = count;
  console.log(data);
  Blaze.renderWithData(Template.questionForm, {question:data}, el);
  count++;
};

Template.questionForm.events({
  "click .addOption": function() {
    addOption(Template.instance().find(".options"));
  }
});

Template.questionForm.created = function() {
  console.log(this);
  if(!this.data.question) {
    var y = Session.get("type");
    y.push("string");
    Session.set("type", y);
  } else {
    var y = Session.get("type");
    y.push(this.data.question.type);
    Session.set("type", y);
  }
}

Template.questionForm.rendered = function() {
  if(this.data.question) {
    this.data.question.options.forEach(function(option) {
      addOption(Template.instance().find(".options"), option);
    }.bind(this));
  } else {
    addOption(Template.instance().find(".options"));
  }
  $(Template.instance().find(".editor")).wysihtml5();
}

Template.quizForm.helpers({
  "titleError": function() {
    return Session.get("titleError");
  }
});

Template.quizForm.events({
  "click .addQuestion": function() {
    addQuestion(Template.instance().find(".questions"));
    no++;
  },
  "submit form": function(e) {
    var data = {
      title: e.target.title.value,
      questions:[]
    };
    if(!data.title) {
      Session.set("titleError", "A quiz must have a title.");
    } else {
      Session.set("titleError", "");
      Template.instance().findAll(".panel").forEach(function(q) {
        q = $(q);
        var question = {
          question: q.find(".editor").val(),
          type: q.find(".type").val(),
          options:[]
        };
        q.find(".option").each(function(i,option) {
          option = $(option);
          var o = {
            title: option.find(".title").val()
          }
          if(option.find(".correct").length === 1) {
            o.correct = option.find(".correct").prop("checked");
          }
          question.options.push(o);
        });
        data.questions.push(question);
      });
      console.log(data);
      Meteor.call("quiz", this._id, data);
      Router.go("/courses/" + this._id + "/quizzes");
    }
    return false;
  }
});

Template.quizForm.rendered = function() {
  count = 0;
  if(this.data.quiz) {
    this.data.quiz.questions.forEach(function(question) {
      addQuestion(Template.instance().find(".questions"), question);
    });
  } else {
    addQuestion(Template.instance().find(".questions"));
  }
  var sort = new Sortable(this.find(".questions"), {
    animation: 150, // ms, animation speed moving items when sorting, `0` — without animation
    handle: ".handle", // Restricts sort start click/touch to the specified element
    draggable: ".panel",
    ghostClass:"ghost"
  });
}

Template.quiz.events({
  "click .del": function() {
    Meteor.call("removeQuiz", this.doc._id, this.quiz._id);
    Router.go("/courses/" + this.doc._id + "/quizzes");
  }
});

Template.insertPost.rendered = function() {
  $("#editor").wysihtml5();
}

Template.post.rendered = function() {
  MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.find(".mathjax")]);
}

var grid, cw, quiz;

var rerun = function() {
  if(quiz.questions.length <= 2) {
    this.find(".crossword").innerHTML = "<p class=\"text-warning\">There must be at least 3 questions in a crossword.</p>";
    return;
  } else if(this.grid === null) {
    this.find(".crossword").innerHTML = "<p class=\"text-warning\">The answers do not fit the grid. Sorry. Bad words: " + cw.getBadWords().map(function(x){return x.word}).join(", ") + "</p>";
  } else {
    this.find(".crossword").innerHTML = crosswordUtils.toHtml(grid);
  }
}

Template.vocabularyQuiz.rendered = function() {
  var complete = false;
  this.autorun(function() {
    if(complete) {
      return;
    }
    var doc = Courses.findOne(this.data._id);
    if(doc) {
      complete = true;
      console.log(this.data);
      console.log(doc);
      quiz = _.findWhere(doc.vocabularyQuizzes, {_id:this.data.quizId});
      if(quiz.format !== "crossword") {
        return;
      }
      var values = quiz.questions.map(function(question) {
        return question.question;
      });
      var keys = quiz.questions.map(function(question) {
        return question.answer;
      });
      var correct = {};
      if(quiz.questions.length > 2) {
        var additional = 0;
        while((grid === null || grid === undefined) && additional < 100) {
          cw = new Crossword(quiz.questions, additional);
          grid = cw.getSquareGrid(10);
          additional += 5;
        }
      }
      rerun.call(this);
    }
  }.bind(this));
};

Template.vocabularyQuiz.events({
  "click .start": function(e) {
    var clues = [];
    if(e.target.dataset.down !== undefined) {
      clues.push({name:"Down", label:e.target.querySelector("span").innerHTML, info: quiz.questions[e.target.dataset.down].question, index:e.target.dataset.down});
    }
    if(e.target.dataset.across !== undefined) {
      clues.push({name:"Across", label:e.target.querySelector("span").innerHTML,info: quiz.questions[e.target.dataset.across].question, index:e.target.dataset.across});
    }
    Template.instance().find(".clues").innerHTML = "";
    Blaze.renderWithData(Template.clues, {clues: clues}, Template.instance().find(".clues"));
  },
  "click .enter": function(e) {
    console.log(quiz.questions);
    if(quiz.questions[e.target.dataset.index].answer.toLowerCase() === e.target.parentNode.parentNode.querySelector("input").value.toLowerCase()) {
      quiz.questions[e.target.dataset.index].visible = true;
      $(e.target).closest(".form-group").remove();
      rerun.call(Template.instance());
    } else {
      $(e.target).closest(".form-group").addClass("has-error");
    }
  }
});

Template.vocabularyQuiz.events({
  "keyup input.answer": function(e) {
    console.log("here");
    if(e.target.dataset.answer.toLowerCase().split(",").map(function(str) {return str.trim()}).indexOf(e.target.value.toLowerCase().trim()) !== -1) {
      if(!e.target.classList.contains("correct")) {
        e.target.classList.add("correct");
        e.target.classList.remove("incorrect");
        if(e.target.nextSibling && e.target.nextSibling.nextSibling) {
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
  "click .revealAnswers": function() {
    if(this.quiz.format !== "crossword") {
      Template.instance().findAll("input").forEach(function(el) {
        if(!el.classList.contains("correct")) {
          el.classList.add("incorrect");
        }
        el.value = el.dataset.answer;
        el.readOnly = true;
      });
    } else {
      quiz.questions.forEach(function(question) {
        question.visible = true;
      });
      rerun.call(Template.instance());
      return false;
    }
  },
  "click .reset": function() {
    if(this.quiz.format !== "crossword") {
      Template.instance().findAll("input").forEach(function(el) {
        el.value = "";
        el.classList.remove("correct");
        el.classList.remove("incorrect");
        el.readOnly = false;
      });
    } else{
      quiz.questions.forEach(function(question) {
        question.visible = false;
      });
      rerun.call(Template.instance());
    }
    return false;
  },
  "click .del": function() {
    Meteor.call("removeVocabularyQuiz", this._id, this.quiz._id);
    Router.go("/courses/" + this._id + "/vocabularyQuizzes")
  }
});

Template.quizAttempt.events({
  "submit form": function() {
    console.log("here");
    var data = {questions:[]};
    this.quiz.questions.forEach(function(question) {
      if(question.type === "string" || question.type === "number") {
        data.questions.push({
          answer: [Template.instance().$(".question" + question.index + " input").val()]
        });
      } else {
        data.questions.push({
          answer: _.pluck(Template.instance().findAll(".question" + question.index + " input:checked"), "value")
        });
      }
    });
    Meteor.call("quizAttempt", this.doc._id, this.quiz._id, data);
    Router.go("/courses/" + this.doc._id + "/quizzes/" + this.quiz._id + "/attempts/" + this.quiz.attempts.length);
    return false;
  }
});

Template.quizResults.rendered = function() {
  var y = Template.instance();
  console.log(this);
  var data = this.data;
  this.autorun(function() {
    console.log(this);
    var doc = Courses.findOne(this.data.id);
    console.log(doc);
    if(doc) {
      console.log(doc);
      var quiz = _.findWhere(doc.quizzes, {_id: this.data.quizId});

      var attempts = {};
      quiz.attempts.forEach(function(attempt) {
        doc.students.forEach(function(user) {
          user = Meteor.users.findOne(user, {fields:{emails:1}});
          user.name = user.emails[0].address.split("@")[0];
          if(user._id === attempt.userId) {
            attempt.score = getInfo(attempt, quiz).score;
            if(Session.equals("criterion", "average")) {
              if(!(user.name in attempts)) {
                attempts[user.name] = [attempt.score];
              } else {
                attempts[user.name].push(attempt.score);
              }
            }
            if(Session.equals("criterion", "best") && (!(user.name in attempts) || attempt.score > attempts[user.name].score)) {
              attempts[user.name] = attempt;
            }
            if(Session.get("criterion", "first") && (!(user.name in attempts) || attempt.date < attempts[user.name].date)) {
              attempts[user.name] = attempt;
            }
          }
        }.bind(this));
      }.bind(this));
      var attemptsL = [];
      for(var user in attempts) {
        if(Session.equals("criterion", "average")) {
          attemptsL.push({user: user, score:attempts[user].reduce(function(a, b) {return a + b}) / attempts[user].length});
        } else {
          attemptsL.push({user: user, score:attempts[user].score, index: attempts[user].index});
        }
      }
      var HEIGHT = attemptsL.length * 30;

      var canvas = d3.select(y.find(".svg"))
      .append('svg')
      .attr({viewBox:"0 0 907 " + (HEIGHT + 70)});

      console.log(quiz.questions.length);

      var color = d3.scale.quantize()
      .domain([0, quiz.questions.length])
      .range(colorbrewer.RdYlGn[9]);

      var xscale = d3.scale.linear()
      .domain([0, quiz.questions.length])
      .range([0,722]);

      var yscale = d3.scale.linear()
      .domain([0, attemptsL.length])
      .range([0, HEIGHT]);

      var	yAxis = d3.svg.axis();
      yAxis
      .orient('left')
      .scale(yscale)
      .tickSize(4)
      .tickFormat(function(d,i){ return attemptsL[i].user; })
      .tickValues(d3.range(attemptsL.length));

      var	xAxis = d3.svg.axis();
      xAxis
      .orient('bottom')
      .scale(xscale)
      .tickFormat(function(d,i){return d.toString()} )
      .tickValues([0].concat(quiz.questions.map(function(d,i){return i +1})));

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
      .data(attemptsL)
      .enter()
      .append('rect')
      .attr('height',19)
      .on('mouseover', function(d){
        d3.select(this).style({fill:d3.rgb(color(d.score)).darker(0.35)})
      })
      .on('mouseout', function(d){
        d3.select(this).style({fill:color(d.score)})
      })
      .on('click', function(d) {
        page("/courses/" + this.id + "/quizzes/" + this.quiz.index + "/attempts/" + d.index)
      }.bind(this))
      .attr({'x':0,'y':function(d,i){ return yscale(i)+19; }})
      .style('fill',function(d,i){ return color(d.score); })
      .attr('width',function(d){ return xscale(d.score); });
    }
  }.bind(this));
}

Template.randomNameGenerator.events({
  "click .btn": function() {
    Template.instance().find(".text-lg").innerHTML = this.students[Math.floor(Math.random() * (this.students.length))];
  }
});

Template.course.events({
  "click .shuffle": function() {
    var rnd = this.doc[this.section][Math.floor(Math.random()* this.doc[this.section].length)]._id;
    Router.go("/courses/" + this.doc._id + "/" + this.section + "/" + rnd);
  }
});

Template.handInFolderForm.events({
  "submit form": function(e) {
    Meteor.call("handInFolder", this.doc._id, {title:e.target.title.value}, this.handInFolder ? this.handInFolder._id: undefined);
    Router.go("/courses/" + this.doc._id + "/handInFolders");
    return false;
  }
});

Template.handInFolder.events({
  "click .handIn": function() {
    var fileEl = document.createElement("input");
    $("body").append(fileEl);
    fileEl.type = "file";
    fileEl.addEventListener("change", function(e) {
      var files = new ReactiveVar([]);
      Blaze.renderWithData(Template.fileUpload, function() {
        console.log(files.get());
        return {files:files.get()};
      }, document.body);
      FS.Utility.eachFile(event, function(file) {
        file = new FS.File(file);
        file.owner = this.doc._id;
        file.category = "handIn";
        file.handInFolder = this.handInFolder._id;
        file.user = Meteor.userId();
        Files.insert(file, function(err, fileObj) {
          var f = files.get();
          f.push(fileObj._id);
          files.set(f);
        }.bind(this));
      }.bind(this));
      $(fileEl).remove();
    }.bind(this));
    fileEl.click();
    return false;
  },
  "click .del": function() {
    Meteor.call("removeHandInFolder", this.doc._id, this.handInFolder._id);
    Router.go("/courses/" + this.doc._id + "/handInFolders");
  }
});

Template.userItem.helpers({
  "getUsername": function() {
    return this.emails[0].address.split("@")[0];
  }
});

Template.userItem.events({
  "click .del": function() {
    Meteor.call("removeUser", this._id);
  }
});

Template.userForm.events({
  "submit form": function(e) {
    var data = {
      email: e.target.email.value,
      students: [],
      teachers: [],
      nothing: []
    }
    Template.instance().findAll(".student.active").forEach(function(el) {
      data.students.push(el.name);
    });
    Template.instance().findAll(".teacher.active").forEach(function(el) {
      data.teachers.push(el.name);
    });
    Template.instance().findAll(".nothing.active").forEach(function(el) {
      data.nothing.push(el.name);
    });
    Meteor.call("user", data, this.user ? this.user._id : undefined);
    Router.go("/admin/users");
    return false;
  },
  "click .btn-group .btn": function(e) {
    $(e.target).siblings().removeClass("active");
    $(e.target).addClass("active");
  }
});

Template.userForm.helpers({
  "getEmail": function() {
    if(this.user) {
      return this.user.emails[0].address;
    }
  },
  "isStudent": function(course, userId) {
    console.log(course);
    console.log(userId);
    return course.students && course.students.indexOf(userId) !== -1;
  },
  "isTeacher": function(course, userId) {
    console.log(course);
    console.log(userId);
    return course.teachers && course.teachers.indexOf(userId) !== -1;
  }
});

Template.courseForm.rendered = function() {
  $(Template.instance().findAll(".select2")).select2({
    minimumInputLength: 1,
    query: function (query) {
      var i = 0;
      var stub = Meteor.autorun(function() {
        var data = Meteor.users.find({"emails.0.address": new RegExp("^" + query.term)}).fetch();
        console.log(data);
        console.log(i);
        if(i === 0) {
          data = data.map(function(user) {
            return {
              text: user.emails[0].address.split("@")[0],
              id: user._id
            }
          });
          query.callback({results:data});
        }
        i++;
      });
    },
    multiple:true,
    initSelection: function(el,cb) {
      console.log("here");
      var ids = $(el).val().split(",");
      Meteor.autorun(function() {
        var data = Meteor.users.find({_id: {$in: ids}}).fetch();
        data = data.map(function(user) {
          return {
            text: user.emails[0].address.split("@")[0],
            id: user._id
          }
        });
        console.log(data);
        cb(data);
      });
    }
  });
  $(Template.instance().find(".icon")).select2({

  });
}

Template.courseForm.events({
  "submit form": function(e) {
    var students = e.target.students.value === "" ? [] : e.target.students.value.split(",");
    var teachers = e.target.teachers.value === "" ? [] : e.target.teachers.value.split(",");
    console.log(students);
    console.log(teachers);
    Meteor.call("course", {
      title: e.target.title.value,
      icon: e.target.icon.value,
      students: students,
      teachers: teachers,
      club:e.target.club.checked
    }, this._id);
    Router.go("/admin/courses");
    return false;
  }
});

Template.admin.events({
  "click .treeview a": function(e) {
    $(e.target).siblings(".treeview-menu").slideToggle();
  }
});

Template.courseItem.events({
  "click .del": function() {
    Meteor.call("removeCourse", this._id);
  }
});
