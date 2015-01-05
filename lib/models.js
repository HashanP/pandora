Courses = new Mongo.Collection("courses");

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
  "format": {
    type: String,
    allowedValues:["short", "long", "crossword"]
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

Schemas.HandIn = new SimpleSchema({
  "userId": {
    type: String
  },
  "fileId": {
    type: String
  }
});

Schemas.HandInFolder = new SimpleSchema({
  "title": {
    type: String
  },
  "handIns": {
    type: [Schemas.HandIn],
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
    max: 20
  },
  "icon": {
    type: String,
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
  "handInFolders": {
    type: [Schemas.HandInFolder],
    optional:true
  },
  "students": {
    type: [String],
    optional:true
  },
  "teachers": {
    type: [String],
    optional:true
  },
  "club": {
    type: Boolean
  }
});

Courses.attachSchema(Schemas.Course);

/**
  *
  */

Schemas.School = new SimpleSchema({
  "title": {
    type: String
  },
  "code": {
    type: String,
    unique : true
  }
});

/*
Schemas.User = new SimpleSchema({
  username: {
    type: String,
    regEx: /^[a-z0-9A-Z_]{3,15}$/,
    optional:true
  },
  emails: {
    type: [Object],
    // this must be optional if you also use other login services like facebook,
    // but if you use only accounts-password, then it can be required
    optional: true
  },
  "emails.$.address": {
    type: String,
    regEx: SimpleSchema.RegEx.Email
  },
  "emails.$.verified": {
    type: Boolean
  },
  createdAt: {
    type: Date
  },
  services: {
    type: Object,
    optional: true,
    blackbox: true
  },
  roles: {
    type: [String],
    optional: true,
    blackbox: true
  }
});

Meteor.users.attachSchema(Schemas.User);
*/
