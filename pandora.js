if (Meteor.isClient) {
	var UsersAdmin = new Mongo.Collection("/admin/users");
	var RoomsAdmin = new Mongo.Collection("/admin/rooms");
	var school = new ReactiveVar();

	Meteor.subscribe("users");

	Router.onBeforeAction(function() {
		if(!school.get()) {
			if(window.location.hostname.split(".").length === 2 || window.location.hostname.split(".").length === 3) {
				Meteor.call("findSchool", window.location.hostname.split(".")[0], function(err, data) {
					school.set(data);
				});
			}
		} else {
			if(!Meteor.userId()) {
				this.render("login");
			} else {
				this.layout("base");
				this.next();
			}
		}
	});

	Router.onAfterAction(function() {
		window.setTimeout(function() { 
			console.log(window.location);
			wnd.set(window.location);	
		}, 0);
	});

	Router.route("/", function() {
		this.render("room");
	});

	Router.route("/admin/users", function() {
		var offset = (this.params.query.page ? parseInt(this.params.query.page, 10)  - 1 : 0) * 10;
		Session.set("limit", 10);
		Session.set("offset", offset);
		Session.set("count", Counts.get("users"));
		Session.set("page", this.params.query.page ? parseInt(this.params.query.page) : 1);
		Session.set("search", this.params.query.search ? this.params.query.search : "");
		this.render("/admin/users");
	});

	Router.route("/admin/users/create", function() {
		Session.set("howToChoosePassword", "username");
		this.render("/admin/users/create");
	});

	Router.route("/admin/rooms", function() {
		Session.set("limit", 10);
		Session.set("count", Counts.get("rooms"));
		Session.set("offset", (this.params.query.page ? parseInt(this.params.query.page, 10)  - 1 : 0) * 10);
		Session.set("page", this.params.query.page ? parseInt(this.params.query.page) : 1);
		Session.set("search", this.params.query.search ? this.params.query.search : "");
		this.render("/admin/rooms");
	});

	Router.route("/admin/rooms/create", function() {
		this.render("/admin/rooms/create");
	});
	
	Template.login.events({
		"form submit": function(e) {
			e.preventDefault();
			Meteor.loginWithPassword(Template.instance().find(".username").value, Template.instance().find(".password").value);
		}
	});
	
	var wnd = new ReactiveVar();
	wnd.set(window.location);
	
	Template.base.onRendered(function() {
		var tmp = Template.instance();
		Tracker.autorun(function() {
			tmp.$(".sidebar li").removeClass("active");
			tmp.$(".sidebar li").each(function(index, li) {
				if(wnd.get().pathname.indexOf($(li).find("a").attr("href")) === 0) {
					$(li).addClass("active");
				}
			});
		});
	});

	Template["/admin/users"].helpers({
		"isAdmin": function() {
			return Template.currentData().roles && Template.currentData().roles.indexOf("admin") !== -1;
		},
		"users": function() {
			return UsersAdmin.find({}, {sort: ["username"]});
		},
		"count": function() {
			return Counts.get("users");
		}
	});

	Template["/admin/rooms"].helpers({
		"rooms": function() {
			return RoomsAdmin.find({}, {sort: ["title"]});
		},
		"count": function() {
			return Counts.get("rooms");
		}	
	});
	
	Template.pagination.helpers({
		"nextPage": function() {
			return Session.get("page") + 1;
		},
		"prevPage": function() {
			return Session.get("page") - 1;
		},
		"isPage": function(n) {
			return Session.equals("page", n);	
		},
		"pages": function() {
			return _.range(1, Math.ceil(Session.get("count")/10)+1);
		},
		"firstPage": function() {
			return Session.get("offset") === 0 ? "disabled": "";
		},
		"lastPage": function() { 
			return Session.get("offset") >= Session.get("count") - 10? "disabled" : "";
		}
	});
	
	Template["/admin/users"].events({
		"click .del": function() {
			Meteor.users.remove(this._id);
		},
		"keyup .search": function(e) {
			if(e.target.value.trim() !== Session.get("search").trim()) {
				if(e.target.value.trim() === "") {
					Router.go("/admin/users");
				} else {
					Router.go("/admin/users?search=" + e.target.value.trim());
				}
			}
		}
	});

	Template["/admin/rooms"].events({
		"keyup .search": function(e) {
			if(e.target.value.trim() !== Session.get("search").trim()) {
				if(e.target.value.trim() === "") {
					Router.go("/admin/rooms");
				} else {
					Router.go("/admin/rooms?search=" + e.target.value.trim());
				}
			}
		},
		"click .del": function() {
			Rooms.remove(this._id);
		}
	});

	Template["/admin/users"].onCreated(function() {
		Tracker.autorun(function() {
			this.subscribe("/admin/users", Session.get("offset"), Session.get("limit"), Session.get("search"));	
			this.subscribe("/admin/users/count", Session.get("search"));
		}.bind(this));
	});
	
	Template["/admin/rooms"].onCreated(function() {
		Tracker.autorun(function() {
			this.subscribe("/admin/rooms", Session.get("offset"), Session.get("limit"), Session.get("search"));
			this.subscribe("/admin/rooms/count", Session.get("search"));
		}.bind(this));
	});

	Template["/admin/rooms/create"].events({
		"submit form": function(e) {
			e.preventDefault();
			Rooms.insert({schoolId: Meteor.user().schoolId, title: Template.instance().$(".title").val(), type: Template.instance().$(".type").val()});
			Router.go("/admin/rooms");
		}
	});

	Template["/admin/users/create"].onRendered(function() {
		Template.instance().$(".subjects-read").select2({
			placeholder:"None"
		});
		
		Template.instance().$(".subjects-write").select2({
			placeholder:"None"
		});
	});

	var formatDate = function(date) {
		var month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [month, day, year].join('/');
	};

	Template["/admin/users/create"].events({
		"change .howToChoosePassword": function(e) {
			Session.set("howToChoosePassword", e.target.value);
		},
		"click .create": function() {
			var username = Template.instance().$(".username").val();
			if(Session.equals("howToChoosePassword", "username")) {
				var password = username;
			} else if(Session.equals("howToChoosePasssword", "dateOfBirth")) {
				var password = formatDate(Template.instance().$(".dateOfBirth").val());
			} else if(Session.equals("howToChoosePassword", "custom")) {
				var password = Template.instance().$(".password").val();
			}
			Meteor.call("createUser2", username, password);
			Router.go("/admin/users");
		}
	});

	Template["/admin/users/create"].helpers({
		"howToChoosePassword": function() {
			return Session.get("howToChoosePassword");
		}
	});

	Handlebars.registerHelper("admin", function() {
		return Meteor.user().roles.indexOf("admin") !== -1;
	});
	
	Handlebars.registerHelper("eq", function(a, b) { 
		return a === b;
	});
}

if (Meteor.isServer) {
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
				limit: limit
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
				limit: limit
			}), this, "/admin/rooms");
			
			this.ready();
		}
	});

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
} 

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
