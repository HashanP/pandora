Courses = new Mongo.Collection("courses");
Files = new FS.Collection("files", {
  stores: [new FS.Store.FileSystem("files", {path: "~/files"})]
});

UI.registerHelper('eq', function(v1, v2, options) {
  if(v1 == v2){
    return true
  } else {
    return false
  }
});

UI.registerHelper("truncate", function(text, max) {
  text = $("<p>" + text + "</p>").text();
  if(text.length > max) {
    return text.substring(0, max) + "...";
  }
  return text;
});

UI.registerHelper("i", function(obj) {
  if(!obj) return null;
  obj.forEach(function(item, i) {
    item.index = i;
  });
  return obj;
});

var getInfo = function(attempt, quiz) {
  var corrects = [];
  var correct = 0;
  console.log(attempt);
  console.log(quiz);
  attempt.questions.forEach(function(question, i) {
    console.log("here");
    if(quiz.questions[i].type === "string" || quiz.questions[i].type === "number") {
      if(quiz.questions[i].options.map(function(str){return str.title.toLowerCase();}).indexOf(question.answer[0].toLowerCase()) !== -1) {
        corrects.push(true);
        correct++;
      } else {
        corrects.push(false);
      }
    } else if(quiz.questions[i].type === "radio") {
      if(question.answer[0] === _.findWhere(quiz.questions[i].options, {correct:true}).title) {
        corrects.push(true);
        correct++;
      } else {
        corrects.push(false);
      }
    } else if(quiz.questions[i].type === "checkbox") {
      console.log(question.answer);
      if(_.uniq(question.answer) === _.uniq(_.pluck(_.where(quiz.questions[i].options, {correct:true}), "title"))) {
        corrects.push(true);
        correct++;
      } else {
        corrects.push(false);
      }
    }
  });
  return {score: correct, corrects: corrects};
}

UI.registerHelper("getScore", function(attempt, quiz) {
  try {
    return getInfo(attempt, quiz).score;
  } catch (e) {
    console.log(e);
  }
});

UI.registerHelper("sortBy", _.sortBy);
UI.registerHelper("shuffle", _.shuffle);

UI.registerHelper("sortByReverse", function(arr, val) {
  return _.sortBy(arr, val).reverse();
})

UI.registerHelper("titleCase", function(str) {
  var result = str.replace(/([A-Z]+)/g, " $1").replace(/([A-Z][a-z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
});

UI.registerHelper("britishDate", function(date) {
  console.log(date);
  return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
});

var Schemas = {};

Schemas.Post = new SimpleSchema({
  "title": {
    type: String
  },
  "content": {
    type: String
  },
  "type": {
    type: String
  },
  "postId": {
    type: String,
    autoValue:function() {
      if(this.operator !== "$pull") {
        return Meteor.uuid();
      }
    }
  },
  "date": {
    type: Date
  }
});

Schemas.VocabularyQuestion = new SimpleSchema({
  "question": {
    type:String
  },
  "answer": {
    type: String
  }
});

Schemas.VocabularyQuiz = new SimpleSchema({
  "title": {
    type: String
  },
  "questions":{
    type:[Schemas.VocabularyQuestion]
  },
  "_id": {
    type: String,
    autoValue:function() {
      if(this.operator !== "$pull" && this.operator !== "$set") {
        return Meteor.uuid();
      }
    }
  }
});

Schemas.Option = new SimpleSchema({
  "title": {
    type: String
  },
  "correct": {
    type: Boolean,
    optional:true
  }
});

Schemas.Question = new SimpleSchema({
  "question":{
    type: String
  },
  "type": {
    type: String,
    allowedValues: ["string", "number", "boolean", "radio", "checkbox"]
  },
  "options": {
    type: [Schemas.Option],
    optional:true
  }
});

Schemas.QuestionAttempt = new SimpleSchema({
  "answer": {
    type: [String],
    optional:true
  }
});

Schemas.QuizAttempt = new SimpleSchema({
  "userId": {
    type: String
  },
  "questions": {
    type: [Schemas.QuestionAttempt],
    optional:true
  },
  "date": {
    type: Date
  }
});

Schemas.Quiz = new SimpleSchema({
  "title": {
    type: String
  },
  "questions": {
    type: [Schemas.Question],
    optional:true
  },
  "attempts": {
    type: [Schemas.QuizAttempt],
    optional:true
  },
  "_id": {
    type: String,
    autoValue:function() {
      if(this.operator !== "$pull" && this.operator !== "$set") {
        return Meteor.uuid();
      }
    }
  }
});

Schemas.Course = new SimpleSchema({
  "title": {
    type: String,
    label: "Title",
    max: 10
  },
  "icon": {
    type: String,
    label: "Icon",
    allowedValues:["French", "Latin", "Computing", "Art", "English", "Mathematics"]
  },
  "posts": {
    type: [Schemas.Post],
    optional: true
  },
  "quizzes": {
    type:[Schemas.Quiz],
    optional:true
  },
  "vocabularyQuizzes": {
    type: [Schemas.VocabularyQuiz],
    optional: true
  },
  "studentResources": {
    type: [String],
    optional:true
  },
  "students": {
    type: [String],
    optional:true,
    autoform: {
      options: function() {
        return _.map(Meteor.users.find().fetch(), function(user) {
          return {
            label: user.emails[0].address,
            value: user._id
          }
        });
      }
    }
  }
});

Courses.attachSchema(Schemas.Course);

if (Meteor.isClient) {
  Meteor.subscribe("userData");

  var lastActive;

  Meteor.startup(function() {
    MathJax.Hub.Config({
    /*  tex2jax: {
        displayMath: [],
        inlineMath: []
      },*/
      /**
      * Disables MathJax's ugly context menu.
      */
      showMathMenu:false,
      "HTML-CSS": { linebreaks: { automatic: true } },
      SVG: { linebreaks: { automatic: true } }
    });
    $("body").on("blur", "input", function(e) {
      console.log("fsddfs");
      lastActive = e.target;
    });
  });


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

  Template.subjects.helpers({
    "courses": function() {
      return Courses.find({}, {sort:{icon:1}});
    }
  });

  Template.navbar.helpers({
    "username":function() {
      if(Meteor.user()) {
        return Meteor.user().emails[0].address.split("@")[0];
      }
    },
    "admin": function() {
      if(Meteor.user()) {
        return Meteor.user().roles.indexOf("admin") !== -1;
      }
    }
  });

  Template.post.helpers({
    "id": function() {
      return this.post.content.split("?v=")[1];
    }
  });

  Template.post.events({
    "click .del": function() {
      Courses.update(this.doc._id, {$pull:{posts:{postId:this.post.postId}}});
      Router.go("/courses/" + this.doc._id +"/blog");
      //return false;
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
      y[this.no] = e.target.value;
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

  Template.insertVocabularyQuiz.events({
    "click .addQuestion": function(e) {
      addVocabularyQuestion(e.target.parentNode.parentNode.parentNode);
    },
    "submit form": function(e) {
      var data = {title:e.target.title.value, questions:[]};
      var el = $(e.target);
      el.find(".question").each(function(i, el) {
        data.questions.push({
          question:$(el).find(".part-q").val(),
          answer:$(el).find(".part-a").val()
        })
      });
      console.log(this.doc._id);
      Meteor.call("vocabularyQuiz", this.doc._id, data, (this.quiz ? this.quiz._id : undefined));
      Router.go("/courses/" + this.doc._id + "/vocabularyQuizzes" + (this.quiz ? "/" + this.quiz._id : ""));
      return false;
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

  Template.vocabularyQuiz.events({
    "change input": function(e) {
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
    },
    "click .del": function() {
      Courses.update(this._id, {$pull: {vocabularyQuizzes:{_id:this.quiz._id}}});
      Router.go("/courses/" + this._id + "/vocabularyQuizzes")
    }
  });

  Template.fileUpload.helpers({
    finished: function() {
      for(var i = 0; i < this.files.length; i++) {
        if(!Files.findOne(this.files[i]).isUploaded()) {
          return false;
        }
      }
      return true;
    }
  });

  Template.studentResources.events({
    "click .del": function(e) {
      Files.remove(this._id);
      Courses.update(Template.instance().data._id, {$pull:{studentResources:this._id}});
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
      fileEl.type = "file";
      fileEl.addEventListener("change", function(e) {
        var files = new ReactiveVar([]);
        Blaze.renderWithData(Template.fileUpload, function() {
          return {files:files.get()};
        }, document.body);
        console.log("here");
        FS.Utility.eachFile(event, function(file) {
          Files.insert(file, function(err, fileObj) {
            var f = files.get();
            f.push(fileObj._id);
            files.set(f);
            Courses.update(this.doc._id, {$push:{studentResources:fileObj._id}});
          }.bind(this));
        }.bind(this));
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
    data.no = Template.currentData().no;
    Blaze.renderWithData(Template.optionForm, data, el, el.querySelector(".btn"));
  }

  var count = 0;
  var addQuestion = function(el, data) {
    if(!data) {
      data = {};
    }
    data.no = count;
    Blaze.renderWithData(Template.questionForm, data, el);
    count++;
  };

  Template.questionForm.events({
    "click .addOption": function() {
      addOption(Template.instance().find(".options"));
    }
  });

  Template.questionForm.created = function() {
    var y = Session.get("type");
    y.push("string");
    Session.set("type", y);
  }

  Template.questionForm.rendered = function() {
    if(this.question) {
      this.question.options.forEach(function(option) {
        addOption(Template.instance().find(".options"), option);
      });
    } else {
      addOption(Template.instance().find(".options"));
    }
    $(Template.instance().find(".editor")).wysihtml5();
  }

  Template.quizForm.events({
    "click .addQuestion": function() {
      addQuestion(Template.instance().find(".questions"));
    },
    "submit form": function(e) {
      var data = {
        title: e.target.title.value,
        questions:[]
      };
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
      return false;
    }
  });

  Template.quizForm.rendered = function() {
    count = 0;
    if(this.quiz) {
      this.quiz.questions.forEach(function(question) {
        addQuestion(Template.instance.find(".questions"), question);
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
      Courses.update(this.doc._id, {$pull:{quizzes:{_id:this.quiz._id}}});
      Router.go("/courses/" + this.doc._id + "/quizzes");
    }
  });

  Template.insertPost.rendered = function() {
    $("#editor").wysihtml5();
  }

  Template.post.rendered = function() {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.find(".mathjax")]);
  }

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

  var stub;
  Template.quizResults.rendered = function() {
    stub = Meteor.autorun(function() {
      var doc = Courses.findOne(this.doc._id);
      var quiz = _.findWhere(doc.quizzes, {_id: this.quiz._id});
    //  var users = Meteor.call("users", )
      var attempts = {};
      this.quiz.attempts.forEach(function(attempt) {
        this.users.forEach(function(user) {
          if(user._id === attempt.userId) {
            attempt.score = getInfo(attempt, this.quiz).score;
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
    });
  }

  Template.course.events({
    "click .shuffle": function() {
      var rnd = this.doc[this.section][Math.floor(Math.random()* this.doc[this.section].length)]._id;
      Router.go("/courses/" + this.doc._id + "/" + this.section + "/" + rnd);
    }
  });

  Router.onBeforeAction(function() {
    if (!Meteor.userId()) {
      this.render('login');
    } else {
      this.next();
    }
  });

  Router.onBeforeAction(function() {
    if(this.route._path.slice(0, 6) !== "/admin") {
      this.layout("course", {
        data: function() {
          return {doc:Courses.findOne(this.params.id), section:this.route._path.split("/")[3]};
        }
      });
    }
    this.next();
  }, {except:["subjects"]});

  Router.route('/', {name: "subjects"});

  Router.route('/courses/:id/blog', function() {
    this.render("blog_list", {
      data: function() {
        return Courses.findOne(this.params.id);
      }
    });
  });

  Router.route('/courses/:id/blog/new', function() {
    Session.set("type", "rich");
    this.render("insertPost", {data: Courses.findOne(this.params.id)});
  });

  Router.route('/courses/:id/blog/:post', function() {
    var data = Courses.findOne(this.params.id);
    this.render("post", {data: {doc: data, post: _.findWhere(data.posts, {postId:this.params.post})}});
  });

  Router.route('/courses/:id/blog/:post/edit', function() {
    var data = Courses.findOne(this.params.id);
    var post = _.findWhere(data.posts, {postId:this.params.post});
    Session.set("type", post.type);
    this.render("insertPost", {data: {doc: data, post: post}});
  });

  Router.route('/courses/:id/vocabularyQuizzes', function() {
    this.render("vocabularyQuizzes", { data: function() { return Courses.findOne(this.params.id);}});
  });

  Router.route('/courses/:id/vocabularyQuizzes/new', function() {
    this.render("insertVocabularyQuiz", {data: function(){ return {doc:Courses.findOne(this.params.id)}; }});
  });

  Router.route("/courses/:id/vocabularyQuizzes/:vocabularyQuiz", function() {
    this.render("vocabularyQuiz", {data: function() {
      var data = Courses.findOne(this.params.id);
      if(data) {
        return {quiz:_.findWhere(data.vocabularyQuizzes, {_id:this.params.vocabularyQuiz}), _id:data._id};
      }
    }});
  });

  Router.route("/courses/:id/vocabularyQuizzes/:vocabularyQuiz/edit", function() {
    var data = Courses.findOne(this.params.id);
    this.render("insertVocabularyQuiz", {data:{quiz:_.findWhere(data.vocabularyQuizzes, {_id:this.params.vocabularyQuiz}), doc:data}});
  });

  Router.route("/courses/:id/studentResources", function() {
    this.render("studentResources", {
      data: function() {
        var data = Courses.findOne(this.params.id);
        if(data && data.studentResources) {
          data.studentResources = data.studentResources.map(function(fileId) {
            return Files.findOne(fileId)
          });
        }
        return data;
      }
    });
  });

  Router.route("/courses/:id/students", function() {
    this.render("students", {
      data: function() {
        var data = Courses.findOne(this.params.id);
        if(data) {
          return {students:_.map(Meteor.users.find({_id: {$in: data.students}}, {fields:{emails:1}}).fetch(), function(user) {
            console.log(user);
            return {
              email:user.emails[0].address,
              username: user.emails[0].address.split("@")[0]
            }
          })}
        }
      }
    });
  });

  Template.randomNameGenerator.events({
    "click .btn": function() {
      Template.instance().find(".text-lg").innerHTML = this.students[Math.floor(Math.random() * (this.students.length))];
    }
  });

  Router.route("/courses/:id/randomNameGenerator", function() {
    this.render("randomNameGenerator", {
      data: function() {
        var data = Courses.findOne(this.params.id);
        if(data) {
          return {students:_.map(Meteor.users.find({_id: {$in: data.students}}, {fields:{emails:1}}).fetch(), function(user) {
            return  user.emails[0].address.split("@")[0];
          })}
        }
      }
    });
  });

  Router.route("/courses/:id/quizzes", function() {
    this.render("quizzes", {
      data: function() {
        return Courses.findOne(this.params.id);
      }
    });
  });

  Router.route("/courses/:id/quizzes/new", function() {
    Session.set("type", []);
    this.render("quizForm", {
      data: function() {
        return Courses.findOne(this.params.id);
      }
    });
  });

  Router.route("/courses/:id/quizzes/:quiz", function() {
    this.render("quiz", {data: function() {
      var data = Courses.findOne(this.params.id);
      if(data) {
        var quiz = _.findWhere(data.quizzes, {_id:this.params.quiz});
        var myAttempts = _.where(quiz.attempts, {userId: Meteor.userId()});
        return {doc: data, quiz: quiz, myAttempts: myAttempts, previousAttempts: myAttempts.length !== 0};
      }
    }})
  });

  Router.route("/courses/:id/quizzes/:quiz/attempt", function() {
    var data = Courses.findOne(this.params.id);
    var quiz = _.findWhere(data.quizzes, {_id:this.params.quiz});
    quiz.questions = quiz.questions.map(function(question, i) {
      question.index = i + 1;
      return question;
    });
    this.render("quizAttempt", {data: {doc: data, quiz:quiz}});
  });

  Router.route("/courses/:id/quizzes/:quiz/attempts/:attempt", function() {
    var data = Courses.findOne(this.params.id);
    var quiz = _.findWhere(data.quizzes, {_id:this.params.quiz});
    var attempt = quiz.attempts[this.params.attempt];
    var info = getInfo(attempt, quiz);
    attempt.questions.forEach(function(question, i) {
      question.question = quiz.questions[i].question;
      question.type = quiz.questions[i].type;
      question.correct = info.corrects[i];
      question.class = (question.correct ? "has-success" : "has-error");
      if(question.type === "radio" || question.type === "checkbox") {
        question.options = quiz.questions[i].options.map(function(c) {
          c.correct = question.answer.indexOf(c.title) !== -1;
          return c;
        });
        question.answer = question.answer[0];
        question.correctAnswer = _.pluck(_.where(quiz.questions[i].options, {correct:true}), "title").join(", ");
      } else {
        question.correctAnswer = _.pluck(_.where(quiz.questions[i].options, {correct:true}), "title").join("/");
      }
      question.index = i +1;
    });
    this.render("previousAttempt", {data: {doc: data, quiz:quiz, attempt:attempt, info:info}});
  });

/*  Router.route('/courses/:id/blog/:post/delete', function() {
    Courses.update(this.doc._id, {$pull: {posts:{postId:this.post.postId}}});
    this.redirect("/courses/" + this.params.id + "/blog");
  });*/

  Router.route("/logout", function() {
    Meteor.logout();
    this.redirect("/");
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  Meteor.publish("userData", function () {
    return Meteor.users.find({},  {fields: {'emails': 1}});
  });

  RssFeed.publish('course', function(query) {
    var self = this;

    if(!query.id) {
      throw new Error();
    }

    var course = Courses.findOne(query.id);

    self.setValue('title', self.cdata(course.title));
    self.setValue('description', self.cdata('This is a live feed of the blog of ' + course.title));
    self.setValue('link', Meteor.absoluteUrl("courses/" + course._id + "/blog"));
    self.setValue('lastBuildDate', new Date());
    self.setValue('pubDate', new Date());
    self.setValue('ttl', 1);
    // managingEditor, webMaster, language, docs, generator

    _.sortBy(course.posts, "date").reverse().forEach(function(doc) {
      self.addItem({
        title: doc.title,
        description: (doc.content.length > 150 ? doc.content.substring(0, 300) + "..." : doc.content),
        link: Meteor.absoluteUrl("courses/" + course._id + "/blog/" + doc.postId),
        pubDate: doc.date,
        guid:doc.postId
      });
    });
  });

  Accounts.config({restrictCreationByEmailDomain:'whsb.essex.sch.uk'});
}

Meteor.methods({
  "post": function(courseId, post, postId) {
    if(postId) {
      Courses.update({_id:courseId,"posts.postId":postId}, {$set:{"posts.$.title": post.title, "posts.$.type":post.type,"posts.$.content":post.content}});
    } else {
      post.date = new Date(Date.now());
      Courses.update(courseId, {$push:{posts:post}});
    }
  },
  "vocabularyQuiz": function(courseId, data, vocabQuizId) {
    if(vocabQuizId) {
      Courses.update({_id:courseId, "vocabularyQuizzes._id":vocabQuizId}, {$set:{
        "vocabularyQuizzes.$.title":data.title, "vocabularyQuizzes.$.questions":data.questions}});
    } else {
      Courses.update(courseId, {$push:{vocabularyQuizzes:data}});
    }
  },
  "quiz": function(courseId, data) {
    Courses.update(courseId, {$push: {quizzes: data}});
  },
  "quizAttempt": function(courseId, quizId, data) {
    data.date = new Date(Date.now());
    data.userId = Meteor.userId();
    Courses.update({_id: courseId, "quizzes._id":quizId}, {$push:{"quizzes.$.attempts":data}});
  }
});

this.AdminConfig = {
  name:"Pandora",
  adminEmails:["10punchihewah@whsb.essex.sch.uk"],
  collections: {
    Users: {
    },
    Courses: {
      omitFields:["posts", "quizzes", "vocabularyQuizzes", "studentResources"],
      auxCollections:["Users"]
    }
  }
};
