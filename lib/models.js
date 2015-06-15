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

Meteor.users.attachSchema(Schemata.User);

Schemata.Room = new SimpleSchema({
	"title": {
		type: String,
		max: 20
	},
	"type": {
		type: String,
		allowedValues: ["class", "club", "other"]
	},
	"schoolId": {
		type: String
	}
});

Rooms = new Mongo.Collection("rooms");
Rooms.attachSchema(Schemata.Room);
