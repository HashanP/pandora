Files = new FS.Collection("files", {
  stores: [new FS.Store.FileSystem("files", {path: "./files"})],
  filter: {
    maxSize: 5 * 1024 * 1024
  }
});

this.isAdmin = function() {
  return Meteor.user() && Meteor.user().roles && Meteor.user().roles.indexOf("admin") !== -1;
}

this.isTeacher = function(courseId) {
  if(isAdmin()) {
    return true;
  } else {
    var doc = Courses.findOne(courseId);
    return doc && doc.teachers && doc.teachers.indexOf(Meteor.userId()) !== -1;
  }
}

this.getInfo = function(attempt, quiz) {
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
      console.log(question);
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

this.AdminConfig = {
  name:"Pandora",
  collections: {
    Users: {
    },
    Courses: {
      omitFields:["posts", "quizzes", "vocabularyQuizzes", "studentResources", "handInFolders"],
      auxCollections:["Users"]
    }
  }
};
