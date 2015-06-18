if (Meteor.isClient) {
	var UsersAdmin = new Mongo.Collection("/admin/users");
	var school = new ReactiveVar();

	Meteor.subscribe("users");
	Meteor.subscribe("/admin/users/count");

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
		var limit = 10;
		var offset = (this.params.query.page ? parseInt(this.params.query.page, 10)  - 1 : 0) * 10;
		Session.set("limit", limit);
		Session.set("offset", offset);
		Session.set("page", this.params.query.page ? parseInt(this.params.query.page) : 1);
		var count = Counts.get("users");
		this.render("/admin/users", {data: {count: count, pluralCount:count !== 1, pages: _.range(1, Math.ceil(count/10)+1), firstPage: offset === 0 ? "disabled": "", lastPage: offset >= count - 10? "disabled" : ""}});
	});

	Router.route("/admin/users/create", function() {
		Session.set("howToChoosePassword", "username");
		this.render("/admin/users/create");
	});

	Router.route("/admin/rooms", function() {
		var limit = 10;
		var offset = (this.params.page ? parseInt(this.params.page, 10)  - 1 : 0) * 10;
		this.render("/admin/rooms", {data: {pluralCount: true, count: 4, offset: offset, limit: limit}});
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
		"isPage": function(n) {
			return Session.equals("page", n);	
		},
		"nextPage": function() {
			return Session.get("page") + 1;
		},
		"prevPage": function() {
			return Session.get("page") - 1;
		}
	});
	
	Template["/admin/users"].events({
		"click .del": function() {
			Meteor.users.remove(this._id);
		}
	});

	Template["/admin/users"].onCreated(function() {
		Tracker.autorun(function() {
			this.subscribe("/admin/users", Session.get("offset"), Session.get("limit"));
		}.bind(this));
	});
	
	Template["/admin/users/create"].onRendered(function() {
		Template.instance().$(".subjects-read").select2({
			placeholder:"None"
		});
		
		Template.instance().$(".subjects-write").select2({
			placeholder:"None"
		});
	});

	Template["/admin/rooms"].onCreated(function() {
		Template.subscribe("/admin/rooms", this.data.offset, this.data.limit);
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
			return Meteor.users.find(this.userId, {fields: {username: 1, roles: 1}});
		}
	});	

	Meteor.publish("/admin/users", function(offset, limit) {
		if(!this.userId) {
			return [];
		}
		var user = Meteor.users.findOne(this.userId);
		if(user.roles.indexOf("admin") !== -1) { 
			Mongo.Collection._publishCursor(Meteor.users.find({
				schoolId: user.schoolId
			}, {
				skip: offset,
				limit: limit
			}), this, "/admin/users");
		
			this.ready();
		}	
	});

	Meteor.publish("/admin/users/count", function() {
		if(!this.userId) {
			return [];
		}
		var user = Meteor.users.findOne(this.userId);
		if(user.roles.indexOf("admin") !== -1) {
			Counts.publish(this, "users", Meteor.users.find({schoolId: user.schoolId}));
		}
	});

	Meteor.publish("/admin/rooms", function(offset, limit) {
		if(!this.userId) {
			return [];
		}
		var user = Meteor.users.findOne(this.userId);
		if(user.roles.indexOf("admin") !== -1) {
			return Rooms.find({schoolId: user.schoolId}, {offset: offset, limit: limit});
		}
	});

	Meteor.methods({
		getUsers: function(offset, limit) {
			if(Meteor.user().roles.indexOf("admin") !== -1) {
				return [Meteor.users.find({schoolId: Meteor.user().schoolId}, {skip:offset, limit:limit, fields: {_id: 1}}).fetch(), Meteor.users.find().count()];
			}
		}
	});

	Meteor.users.allow({
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
			Accounts.createUser({
				username: username, 
				password: password,
				profile: {
					schoolId: Meteor.user().schoolId
				}
			});	
		} else {
			throw Meteor.Error(403, "Access Denied");
		}
	}
});
