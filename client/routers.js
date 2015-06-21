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

Router.route("/admin/users/:user/edit", function() {
	Meteor.call("findUser", this.params.user, function(err, user) {
		Meteor.call("findRoomsByUser", this.params.user, function(err, data) {
			this.render("/admin/users/create", {data: _.extend(user, {students: data[0], teachers: data[1]})});
		}.bind(this));
	}.bind(this));
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

Router.route("/admin/rooms/:room/edit", function() {
	Meteor.call("findRoom", this.params.room, function(err, data) {
		this.render("/admin/rooms/create", {data: data});
	}.bind(this));
});	
