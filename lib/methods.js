Meteor.methods({ 
	findSchool: function(hostname) { 
		return Schools.findOne({hostname: hostname}); 
	}, 
	createUser2: function(username, password) { 
		if(Meteor.user() && Meteor.user().roles.indexOf("admin") !== -1) { 
			Accounts.createUser({ username: username, password: password, profile: { schoolId: Meteor.user().schoolId } });	
		} else { 
			throw Meteor.Error(403, "Access Denied"); 
		} 
	} 
});
