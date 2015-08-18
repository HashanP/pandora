Files = new FS.Collection("files", { 
	stores: [new FS.Store.FileSystem("files", {path:"~/uploads"})]
});

var Schemata = {};


Schemata.Comment = new SimpleSchema({
	text: {
		type: String
	},
	userId: {
		type: String
	},
	date: {
		type: Date
	},
	commentId: {
		type: String,
		autoValue:function() {
			if(this.operator !== "$pull") {
        return Meteor.uuid();
      }
    }
	}
});

Schemata.Notice = new SimpleSchema({
	text: {
		type: String,
		optional:true
	},
	images: {
		type: [Object]
	},
	"images.$.title": {
		type: String
	},
	"images.$.data": {
		type: String
	},
	youtubes: {
		type: [Object]
	},
	"youtubes.$.id": {
		type: String
	},
	"youtubes.$.title": {
		type: String
	},
	allowComments: {
		type: Boolean
	},
	comments: {
		type: [Schemata.Comment]
	},
	roomId: {
		type: String
	},
	date: {
		type: String
	},
	userId: {
		type: String	
	}
});

Schemata.Poll = new SimpleSchema({
	text: {
		type: String
	},
	pollOptions: {
		type: [Object]
	},
	"pollOptions.$.title": {
		type: String
	},
	"pollOptions.$.votes": {
		type: Number
	},
	roomId: {
		type: String
	},
	date: {
		type: Date
	},
	comments: {
		type: [Schemata.Comment]
	},
	allowComments: {
		type: Boolean
	},
	userId: {
		type: String
	},
	voted: {
		type: [String]
	}
});

Schemata.Upload = new SimpleSchema({
	userId: {
		type: String
	},
	files: {
		type: [String]
	},
	comment: {
		type: String,
		optional:true
	},	
	grade: {
		type: String,
		optional:true
	}
});

Schemata.Reminder = new SimpleSchema({
	text: {
		type: String
	},
	eventDate: {
		type: Date
	},
	date: {
		type: Date
	},
	comments: {
		type: [Schemata.Comment]
	},
	allowComments: {
		type: Boolean
	},
	roomId: {
		type: String
	},
	userId: {
		type: String
	}
});

Schemata.Assignment = new SimpleSchema({
	text: {
		type: String
	},
	deadline: {
		type: Date
	},
	comments: {
		type: [Schemata.Comment]
	},
	allowComments: {
		type: Boolean
	},
	roomId: {
		type: String
	},
	date: {
		type: Date
	},
	userId: {
		type: String
	},
	uploads: {
		type: [Schemata.Upload]
	},
	uploadViaPandora: {
		type: Boolean
	},
	completed: {
		type: [String],
		optional:true
	}
});

Notices = new Mongo.Collection("notices", {
	transform: function(doc) {
		doc.type = "notice";
		return doc;
	}
});
Notices.attachSchema(Schemata.Notice);

Reminders = new Mongo.Collection("reminders", {
	transform: function(doc) {
		doc.type = "reminder";
		return doc;
	}
});
Reminders.attachSchema(Schemata.Reminder);

Polls = new Mongo.Collection("polls", {
	transform: function(doc) {
		doc.type = "poll";
		return doc;
	}
});
Polls.attachSchema(Schemata.Poll);

Assignments = new Mongo.Collection("assignments", {
	transform: function(doc) {
		doc.type = "assignment";
		return doc;
	}
});
Assignments.attachSchema(Schemata.Assignment);

Schemata.School = new SimpleSchema({
  name: {
    type: String,
    max: 100
  },
  hostname: {
    type: String,
    max: 50
  },
  max_users: {
    type: Number
  },
  max_classes: {
    type: Number
  }
});

Schools = new Mongo.Collection("schools");
Schools.attachSchema(Schemata.School);

Schemata.User = new SimpleSchema({
	username: {
    type: String,
//    regEx: /^[a-z0-9A-Z_]{3,20}$/,
    optional:true,
		unique:true,
		max: 20
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
  },
	schoolId: {
		type: String,
		optional: true
	}
});

Schemata.Option = new SimpleSchema({
	value: {
		type: String,
		max: 100	
	},
	correct: {
		type: Boolean,
		optional: true
	}
});

var Question = {
	title: {
		type: String,
		max: 100
	},
	type: {
		type: String,
		allowedValues: ["text", "number", "fill_in_the_blanks", "list", "checkboxes"]
	},
	help_text: {
		type: String,
		max: 1000,
		optional: true
	},
	possibleTextAnswers: {
		type: [String],
		max: 100,
		optional: true
	},
	possibleNumberAnswers: {
		type: [Number],
		max: 100,
		optional: true
	},
	options: {
		type: [Schemata.Option],
		optional: true
	},
	text: {
		type: String,
		optional: true
	}
};

Schemata.Question = new SimpleSchema(Question);

Schemata.QuestionResult = new SimpleSchema(_.extend(Question, {
	correct: {
		type: Boolean,
		optional: true
	},
	marks: {
		type: Number,
		optional: true
	},
	textAnswer: {
		type: String,
		optional: true
	}, 
	numberAnswer: {
		type: Number,
		optional: true
	},
	listAnswer: {
		type: String,
		optional: true
	},
	checkboxesAnswer: {
		type: [String],
		optional: true
	},
	filbAnswer: {
		type: [String],
		optional: true
	}
}));

Schemata.Quiz = new SimpleSchema({
	questions: {
		type: [Schemata.Question]
	},
	roomId: {
		type: String
	}
});

Quizzes = new Mongo.Collection("quizzes");
Quizzes.attachSchema(Schemata.Quiz);

Schemata.QuizResult = new SimpleSchema({
	quizId: {
		type: String
	},
	userId: {
		type: String
	},
	score: {
		type: Number
	},
	questions: {
		type: [Schemata.QuestionResult]
	},
	date: {
		type: Date,
		autoValue: function() {
			return new Date(Date.now());
		}
	},
	max: {
		type: Number
	} 
});

QuizResults = new Mongo.Collection("quizResults");
QuizResults.attachSchema(Schemata.QuizResult);

Schemata.VocabQuestion = new SimpleSchema({
	question: {
		type: String
	},
	answer: {
		type: String
	}
});

Schemata.VocabQuiz = new SimpleSchema({
	roomId: {
		type: String
	},
	questions: {
		type: [Schemata.VocabQuestion]
	}
});

VocabQuizzes = new Mongo.Collection("vocabQuizzes");
VocabQuizzes.attachSchema(Schemata.VocabQuiz);

Meteor.users.attachSchema(Schemata.User);

Schemata.Room = new SimpleSchema({
	"title": {
		type: String,
		max: 20,
		unique:true
	},
	"type": {
		type: String,
		allowedValues: ["subject", "club", "other"]
	},
	"schoolId": {
		type: String
	},
	"teachers": {
		type: [String],
		optional:true
	},
	"students": {
		type: [String],
		optional:true
	},
	"files": {
		type: [Object],
		blackbox:true,
		defaultValue: []
	},
	"quizzes": {
		type: [Object],
		defaultValue: [],
		blackbox:true
	}
});

Rooms = new Mongo.Collection("rooms");
Rooms.attachSchema(Schemata.Room);
