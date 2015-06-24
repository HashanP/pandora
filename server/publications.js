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

Meteor.publish("rooms", function() {
	if(!this.userId) {
		return [];
	}
	return Rooms.find({$or: [{students: {$in: [this.userId]}}, {teachers: {$in: [this.userId]}}]});
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
