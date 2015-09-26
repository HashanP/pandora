var isAdmin2 = function(userId, doc) {
	if(!userId) {
		return false;
	} else {
		var user = Meteor.users.findOne(userId);
		return (user.roles && user.roles.indexOf("admin") !== -1 && doc.schoolId === user.schoolId);
	}
}

Meteor.users.allow({ 
	remove: function(userId, doc) { 
		return isAdmin2(userId, doc) && doc._id !== userId;
	} 
}); 

Rooms.allow({
	insert: isAdmin2,
	update: isAdmin2, 
	remove: isAdmin2
}); 

var updateQuiz = function(userId, doc) {
	if(!userId) {
		return false;
	} else {
		var user = Meteor.users.findOne(userId);
		var room = Rooms.findOne(doc.roomId);
		return ((user.roles && user.roles.indexOf("admin") !== -1) || (room.teachers.indexOf(userId) !== -1)) && user.schoolId === room.schoolId;
	}
}

Notices.allow({
	insert: updateQuiz,
	update: updateQuiz,
	remove: updateQuiz
});

Reminders.allow({
	insert: updateQuiz,
	update: updateQuiz,
	remove: updateQuiz
});

Assignments.allow({
	insert: updateQuiz,
	update: updateQuiz,
	remove: updateQuiz
});

Polls.allow({
	insert: updateQuiz,
	remove: updateQuiz
});

Quizzes.allow({
	update: updateQuiz
});

VocabQuizzes.allow({
	update: updateQuiz
});

Rooms.before.insert(function(userId, doc) {
	doc.schoolId = Meteor.users.findOne(userId).schoolId;
	return doc;
});

Files.on("stored", Meteor.bindEnvironment(function(doc) {
  if(doc.category === "resource") {
		var room = Rooms.findOne(doc.owner);
		if(!room.files) {
			room.files = [];
		}
		var b = room.files;
		var path = "";
		if(doc.path !== "/") {
			doc.path =  "/" + doc.path;
		} else {
			path = "/";
		}
		while(path !== doc.path) {
			var n = doc.path.slice(path.length + 1).split("/")[0];
			if(_.findWhere(b, {name: n})) {
				path += "/" + n;
				b = _.findWhere(b, {name: n});
				if(!b.files) {
					b.files = [];
				}
				b = b.files
			} else {
				break;
			}	
		}
		if(path === doc.path) {
			var c = _.findWhere(b, {name: doc.name()});
			if(c && c.type === "folder") {
				return Files.remove(doc._id);
			}
			if(c) {
				Files.remove(b[b.indexOf(c)]._id);		
				b.splice(b.indexOf(c), 1);	
			}
			b.push({type: "file", _id: doc._id, name: doc.name()});
			Rooms.update(doc.owner, {$set: {files: room.files}});
		} else {
			Files.remove(doc._id);
		}
  } else if(doc.category === "upload") {
		var assignment = Assignments.findOne(doc.assignmentId);
		var room = Rooms.findOne(doc.owner);
		if(assignment.roomId !== doc.owner) {
			Files.remove(doc._id);
		} else if(room.students.indexOf(doc.userId) === -1) {
			Files.remove(doc._id);
		}
		Assignments.update({_id: assignment._id, "uploads.userId": doc.userId}, {$push: {"uploads.$.files": doc._id}});
		Assignments.update({_id: assignment._id, "uploads": {$not: {$elemMatch: {userId: doc.userId}}}}, {$push: {uploads: {userId: doc.userId, files: [doc._id]}}});
	} 
}));

Files.on("removed", function(doc) {
	if(doc.category === "resource") {
		var room = Rooms.findOne(doc.owner);
		var b = room;
		if(doc.path === "/") {
			b.files = _.without(b.files, _.findWhere(b.files, {_id: doc._id}));
		} else {
			doc.path.split("/").forEach(function(name) {
				b = _.findWhere(b.files, {name: name});
			});
			b.files = _.without(b.files, _.findWhere(b.files, {_id: doc._id}));
		}
		Rooms.update(doc.owner, {$set: {files: room.files}});
	} else if(doc.category === "upload") {
		Assignments.update({_id: doc.assignmentId, "uploads.userId": doc.userId}, {$pull: {"uploads.$.files": doc._id}});
		Assignments.update({_id: doc.assignmentId}, {$pull: {uploads: {userId: doc.userId, files: []}}});
	}
});

var isAdmin = function(userId) {
	if(!userId) {
		return false;
	} else {
		var user = Meteor.users.findOne(userId);
		return user.roles && user.roles.indexOf("admin") !== -1;
	}
}

var isTeacher = function(userId, doc) {
	var room = Rooms.findOne(doc);
	return room.teachers.indexOf(userId) !== -1 || isAdmin(userId);
}

var isStudent = function(userId, doc) {
	var room = Rooms.findOne(doc);
	return room.students.indexOf(userId) !== -1 || room.teachers.indexOf(userId) !== -1 || isAdmin(userId);
}

Files.allow({
	insert: function(userId, doc) {
		return isTeacher(userId, doc.owner);
	},
	remove: function(userId, doc) {
		if(doc.category === "resource") {
			return isTeacher(userId, doc.owner);
		} else if(doc.category === "upload") {
			return isStudent(userId, doc.owner);
		}
	},
	download: function(userId, doc) {
		if(doc.category === "resource") {
			return isStudent(userId, doc.owner);
		} else if(doc.category === "upload") {
			return isTeacher(userId, doc.owner) || doc.userId === doc.owner;
		}
	}
});

Meteor.publish("files", function(room) {
	return Files.find({category: "resource", owner: room});
});

Meteor.publish("noticeFiles", function(room) {
	return Files.find({category:"upload", owner: room, userId: this.userId});
});

Meteor.users.before.remove(function(userId, doc) {
	Rooms.update({}, {$pull: {students: doc._id, teachers: doc._id}}, {multi:true});
});

Quizzes.after.remove(function(userId, doc) {
	QuizResults.remove({quizId: doc._id});
});
					
Accounts.onCreateUser(function(options, user) { 
	user.schoolId = options.profile.schoolId; 
	return user; 
}); 
