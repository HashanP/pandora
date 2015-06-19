Meteor.users.allow({ 
	remove: function() { 
		return true; 
	} 
}); 

Rooms.allow({
	insert: function(userId, doc) {
		if(!userId) {
			return false;
		} else {
			var user = Meteor.users.findOne(userId);
			return (user.roles && user.roles.indexOf("admin") !== -1 && doc.schoolId === user.schoolId);
		}
	}, 
	remove: function() {
		return true;
	}
}); 
					
Accounts.onCreateUser(function(options, user) { 
	user.schoolId = options.profile.schoolId; 
	return user; 
}); 
