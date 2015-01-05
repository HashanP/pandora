Router.onBeforeAction(function() {
  if (!Meteor.userId()) {
    this.render('login');
  } else {
    Session.set("titleError", "");
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
  } else {
    this.layout("admin")
  }
  this.next();
}, {except:["subjects", "clubs"]});

Router.route("/", function() {
  return this.render("subjects", {data:{courses: Courses.find({club:false}).fetch(), selected: "subjects"}});
}, {name:"subjects"});

Router.route('/clubs', function() {
  this.render("subjects", {data: {courses: Courses.find({club:true}), selected:"clubs"}});
}, {name:"clubs"});

Router.route('/courses/:id/blog', function() {
  this.render("posts", {data:  Courses.findOne(this.params.id)});
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
      return {quiz:_.findWhere(data.vocabularyQuizzes, {_id:this.params.vocabularyQuiz}), _id:data._id, quizId:this.params.vocabularyQuiz};
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

Router.route("/courses/:id/quizzes/:quiz/edit", function() {
  var data = Courses.findOne(this.params.id);
  if(data) {
    var quiz = _.findWhere(data.quizzes, {_id:this.params.quiz});
    Session.set("type", []);
    this.render("quizForm", {data:{quiz:quiz, doc:data}});
  }
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

Router.route("/courses/:id/quizzes/:quiz/results", function() {
  Session.set("criterion", "best");
  this.render("quizResults", {data: this.params});
});

Router.route("/courses/:id/handInFolders", function() {
  this.render("handInFolders", {data: Courses.findOne(this.params.id)});
});

Router.route("/courses/:id/handInFolders/new", function() {
  this.render("handInFolderForm", {data: {doc:Courses.findOne(this.params.id)}});
});

Router.route("/courses/:id/handInFolders/:handInFolder", function() {
  var doc = Courses.findOne(this.params.id);
  var handInFolder = _.findWhere(doc.handInFolders, {_id: this.params.handInFolder});
  var myHandIns = _.where(handInFolder.handIns, {userId:Meteor.userId()});
  if(isTeacher() && handInFolder.handIns) {
      handInFolder.handIns = handInFolder.handIns.map(function(handIn) {
        handIn.username = Meteor.users.findOne(handIn.userId).emails[0].address.split("@")[0];
        return handIn;
      });
  }
  this.render("handInFolder", {data:{doc: doc, handInFolder: handInFolder, myHandIns: myHandIns}});
});

Router.route("/courses/:id/handInFolders/:handInFolder/edit", function() {
  var doc = Courses.findOne(this.params.id);
  var handInFolder = _.findWhere(doc.handInFolders, {_id: this.params.handInFolder});
  this.render("handInFolderForm", {data: {doc: Courses.findOne(this.params.id), handInFolder:handInFolder}});
});

Router.route("/admin", function() {
  var usersCount = Meteor.users.find({}).count();
  var coursesCount = Courses.find({}).count();
  this.render("dashboard", {data: {usersCount: usersCount, coursesCount: coursesCount}});
});

Router.route("/admin/users", function(e) {
  var count = Meteor.users.find({}).count();
  var page = parseInt(this.params.query.page, 10) || 0;
  if(count > (page + 1) * 10) {
    var next = page + 1;
  } else {
    var next = false;
  }
  if(page !== 0) {
    var prev = page - 1;
  } else {
    var prev = false;
  }
  var offset = page * 10;
//  var users = Meteor.users.find({}, {skip:offset, limit: 10});
    this.render("users", {data: {users: Meteor.users.find(), count:count}});
});

Router.route("/admin/users/new", function(e) {
  this.render("userForm", {data: {courses: Courses.find()}});
});

Router.route("/admin/users/:id", function(e) {
  this.render("userForm", {data: {courses: Courses.find({club:false}), user: Meteor.users.findOne(this.params.id)}});
});

Router.route("/admin/courses", function(e) {
  this.render("listCourses", {data: {courses: Courses.find()}});
});

Router.route("/admin/courses/new", function(e) {
  this.render("courseForm");
});

Router.route("/admin/courses/:id", function() {
  var course = Courses.findOne(this.params.id);
  if(course) {
    this.render("courseForm", {data: course});
  }
});

Router.route("/logout", function() {
  Meteor.logout();
  this.redirect("/");
});
