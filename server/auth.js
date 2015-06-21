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

Meteor.users.before.remove(function(userId, doc) {
	Rooms.update({}, {$pull: {students: doc._id, teachers: doc._id}}, {multi:true});
});
					
Accounts.onCreateUser(function(options, user) { 
	user.schoolId = options.profile.schoolId; 
	return user; 
}); 
