Meteor.methods({
  "post": function(courseId, post, postId) {
    if(isTeacher(courseId)) {
      if(postId) {
        Courses.update({_id:courseId,"posts.postId":postId}, {$set:{"posts.$.title": post.title, "posts.$.type":post.type,"posts.$.content":post.content}});
      } else {
        post.date = new Date(Date.now());
        Courses.update(courseId, {$push:{posts:post}});
      }
    } else {
      throw new Error("Unauthorised");
    }
  },
  "vocabularyQuiz": function(courseId, data, vocabQuizId) {
    if(isTeacher(courseId)) {
      if(vocabQuizId) {
        Courses.update({_id:courseId, "vocabularyQuizzes._id":vocabQuizId}, {$set:{
          "vocabularyQuizzes.$.title":data.title, "vocabularyQuizzes.$.questions":data.questions, "vocabularyQuizzes.$.format":data.format}});
        } else {
          Courses.update(courseId, {$push:{vocabularyQuizzes:data}});
        }
      } else {
        throw new Error("Unauthorised");
      }
    },
    "quiz": function(courseId, data) {
      if(isTeacher(courseId)) {
        Courses.update(courseId, {$push: {quizzes: data}});
      } else {
        throw new Error("Unauthorised");
      }
    },
    "quizAttempt": function(courseId, quizId, data) {
      data.date = new Date(Date.now());
      data.userId = Meteor.userId();
      Courses.update({_id: courseId, "quizzes._id":quizId}, {$push:{"quizzes.$.attempts":data}});
    },
    "removeVocabularyQuiz": function(courseId, quizId) {
      if(isTeacher(courseId)) {
        Courses.update(courseId, {$pull: {vocabularyQuizzes:{_id:quizId}}});
      } else {
        throw new Error("Unauthorised");
      }
    },
  "removeQuiz": function(courseId, quizId) {
    if(isTeacher(courseId)) {
      Courses.update(courseId, {$pull:{quizzes:{_id:quizId}}});
    } else {
      throw new Error("Unauthorised");
    }
  },
  "removePost": function(courseId, postId) {
    if(isTeacher(courseId)) {
      Courses.update(courseId, {$pull:{posts:{postId:postId}}});
    } else {
      throw new Error("Unauthorised");
    }
  },
  "handInFolder": function(courseId, data, handInFolderId) {
    if(handInFolderId) {
      Courses.update({_id:courseId, "handInFolders._id":handInFolderId}, {$set:{"handInFolders.$.title": data.title}});
    } else {
      Courses.update(courseId, {$push:{handInFolders: data}});
    }
  },
  "removeHandInFolder": function(courseId, handInFolderId) {
    if(Meteor.isServer) {
      var course = Courses.findOne(courseId);
      var handInFolder = _.findWhere(course.handInFolders, {_id:handInFolderId});
      if(handInFolder.handIns) {
        handInFolder.handIns.forEach(function(handIn) {
          Files.remove(handIn.fileId);
        });
      }
    }
    Courses.update(courseId, {$pull:{handInFolders:{_id:handInFolderId}}});
  }
});
