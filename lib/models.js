Files = new FS.Collection("files", { 
	stores: [new FS.Store.FileSystem("files", {path:"~/uploads"})]
});

var Schemata = {};

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
		type: Boolean
	}
});

Schemata.Question = new SimpleSchema({
	title: {
		type: String,
		max: 100
	},
	help_text: {
		type: String,
		max: 1000
	},
	possibleTextAnswers: {
		type: [String],
		max: 100
	},
	possibleNumberAnswers: {
		type: [Number],
		max: 100
	},
	options: {
		type: [Schemata.Option]
	},
	text: {
		type: String
	}
});

Schemata.Quiz = new SimpleSchema({
	questions: {
		type: [Schemata.Question]
	},
	roomId: {
		type: String
	}
});

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
		type: [Schemata.Question]
	},
	date: {
		type: Date,
		defaultValue: Date.now
	} 
});

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
		max: 20
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
	"notices": {
		type: [Object],
		optional:true,
		blackbox:true
	},
	"notices.$.noticeId": {
    type: String,
    autoValue:function() {
      if(this.operator !== "$pull") {
        return Meteor.uuid();
      }
    }
  },
	"files": {
		type: [Object],
		optional:true,
		blackbox:true
	},
	"quizzes": {
		type: [Object],
		optional:true,
		blackbox:true
	}
});

Rooms = new Mongo.Collection("rooms");
Rooms.attachSchema(Schemata.Room);
