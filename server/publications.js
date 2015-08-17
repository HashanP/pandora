Meteor.publish("users", function() {
	if(this.userId) {
		return Meteor.users.find(this.userId, {fields: {username: 1, roles: 1, schoolId: 1}});
	}
});	

Meteor.publish("/admin/users", function(offset, limit, search) {
	if(!this.userId) {
		return [];
	}
	var user = Meteor.users.findOne(this.userId);
	var query = {schoolId: user.schoolId};
	if(search) {
		query.username = new RegExp(search, "i");
	}
	if(user.roles.indexOf("admin") !== -1) { 
		Mongo.Collection._publishCursor(Meteor.users.find(query, {
			skip: offset,
			limit: limit,
			sort: ["username"]
		}), this, "/admin/users");
	
		this.ready();
	}	
});

Meteor.publish("/admin/users/count", function(search) {
	if(!this.userId) {
		return [];
	}
	var user = Meteor.users.findOne(this.userId);
	if(user.roles.indexOf("admin") !== -1) {
		if(!search) {
			Counts.publish(this, "users", Meteor.users.find({schoolId: user.schoolId}));
		} else {
			Counts.publish(this, "users", Meteor.users.find({schoolId: user.schoolId, username: new RegExp(search, "i")}));
		}
	}
});

Meteor.publish("/admin/rooms/count", function(search) {
	if(!this.userId) {
		return [];
	} 
	var user = Meteor.users.findOne(this.userId);
	var query = {schoolId: user.schoolId};
	if(search) {
		query.title = new RegExp(search, "i");
	}
	if(user.roles.indexOf("admin") !== -1) {
		Counts.publish(this, "rooms", Rooms.find(query));
	}
});

Meteor.publish("/admin/rooms", function(offset, limit, search) {
	if(!this.userId) {
		return [];
	}
	var user = Meteor.users.findOne(this.userId);
	var query = {schoolId: user.schoolId};
	if(search) {
		query.title = new RegExp(search, "i");
	}
	if(user.roles.indexOf("admin") !== -1) {
		Mongo.Collection._publishCursor(Rooms.find(query, {
			skip: offset,
			limit: limit,
			sort: ["title"]
		}), this, "/admin/rooms");
		
		this.ready();
	}
});

Meteor.publishComposite("rooms", {
	find: function() {
		if(!this.userId) {
			return [];
		}
		var user = Meteor.users.findOne(this.userId);
		if(user.roles && user.roles.indexOf("admin") !== -1) {
			return Rooms.find({schoolId: user.schoolId});
		} else {
			return Rooms.find({$or: [{students: {$in: [this.userId]}}, {teachers: {$in: [this.userId]}}]});
		}
	},
	children: [
		{
			find: function(doc) {
				return Meteor.users.find({$or: [{_id: {$in: doc.students}}, {roles: {$in: ["admin"]}}], schoolId: doc.schoolId}, {fields: {username: 1}});	
			}
		}
	]
});

Meteor.methods({
	"findRoom": function(userId) {
		var user = Meteor.users.findOne(this.userId);
		if(user.roles.indexOf("admin") !== -1) {
			return Rooms.findOne(userId);
		}
	},
	"findRooms": function(term) {
		var user = Meteor.users.findOne(this.userId);
		if(user.roles.indexOf("admin") !== -1) {
			return Rooms.find({title: new RegExp(term, "i")}, {sort: ["title"]}).fetch();
		}
	},
	"findUser": function(userId) {
		var user = Meteor.users.findOne(this.userId);
		if(user.roles.indexOf("admin") !== -1) {
			return Meteor.users.findOne(userId);
		}
	},
	"findUsers": function(term) {
		var user = Meteor.users.findOne(this.userId);
		if(user.roles.indexOf("admin") !== -1) {
			return Meteor.users.find({username: RegExp(term, "i")}, {sort: ["username"]}).fetch();
		}
	},
	"findRoomsByUser": function(userId) {
		var user = Meteor.users.findOne(this.userId);
		if(user.roles.indexOf("admin") !== -1) {
			return [Rooms.find({students: {$in: [userId]}}, {fields: {title: 1}}).fetch(), Rooms.find({teachers: {$in: [userId]}}, {fields: {title: 1}}).fetch()];
		}
	}
});

Meteor.publish("vocabQuizzes", function(id) {
	return VocabQuizzes.find({_id: id});
});

Meteor.publish("quizzes", function(id) {
	return Quizzes.find({_id: id});
});

Meteor.publish("quizResults", function(id) {
	return QuizResults.find({quizId: id, userId: this.userId});	
});

Meteor.publish("notices", function(id) {
	return [Notices.find({roomId: id}), 
		Polls.find({roomId: id}),
		Reminders.find({roomId: id}),
		Assignments.find({roomId: id})
	];
});
