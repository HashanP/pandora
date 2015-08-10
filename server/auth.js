Meteor.users.allow({ 
	remove: function() { 
		return true; 
	} 
}); 

var isAdmin = function(userId, doc) {
	console.log("here");
	if(!userId) {
		return false;
	} else {
		var user = Meteor.users.findOne(userId);
		return (user.roles && user.roles.indexOf("admin") !== -1 && doc.schoolId === user.schoolId);
	}
}

Rooms.allow({
	insert: isAdmin,
	update: isAdmin, 
	remove: function() {
		return true;
	}
}); 

Quizzes.allow({
	update: function(userId, doc) {
		if(!userId) {
			return false;
		} else {
			var user = Meteor.users.findOne(userId);
			var room = Rooms.findOne(doc.roomId);
			return ((user.roles && user.roles.indexOf("admin") !== -1) || (room.teachers.indexOf(userId) !== -1)) && user.schoolId === room.schoolId;
		}
	}
});

Files.on("stored", Meteor.bindEnvironment(function(doc) {
  if(doc.category === "resource") {
		var room = Rooms.findOne(doc.owner);
		console.log(room.files);
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
			console.log(n);
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
		console.log(path);
		console.log(doc.path);
		if(path === doc.path) {
			b.push({type: "file", _id: doc._id, name: doc.name()});
			Rooms.update(doc.owner, {$set: {files: room.files}});
		} else {
			console.log("hell");
			Files.remove(doc._id);
		}
  } 
}));

Files.on("removed", function(doc) {
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
});

var isAdmin = function(userId) {
	var user = Meteor.users.findOne(userId);
	return user.roles.indexOf("admin") !== -1;
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
	insert: function() {
		return true;
	},
	remove: function(userId, doc) {
		return isTeacher(userId, doc.owner);
	},
	download: function(userId, doc) {
		return isStudent(userId, doc.owner);
	}
});

Meteor.publish("files", function(room) {
	return Files.find({category: "resource", owner: room});
});

Meteor.users.before.remove(function(userId, doc) {
	Rooms.update({}, {$pull: {students: doc._id, teachers: doc._id}}, {multi:true});
});
					
Accounts.onCreateUser(function(options, user) { 
	user.schoolId = options.profile.schoolId; 
	return user; 
}); 
