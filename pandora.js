if (Meteor.isClient) {
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

	Router.route("/", function() {
		this.render("room");
	});

	Router.route("/admin/users", function() {
		this.render("admin/users", {data: {users: Meteor.users.find().fetch()}});
	});

	Template.login.events({
		"form submit": function(e) {
			e.preventDefault();
			Meteor.loginWithPassword(Template.instance().find(".username").value, Template.instance().find(".password").value);
		}
	});

	Template.base.onRendered(function() {
		Template.instance().$("a[href=\"" + window.location.pathname + "\"]").parent().addClass("active");
	});

	Template["admin/users"].helpers({
		"isAdmin": function() {
			return Template.currentData().roles.indexOf("admin") !== -1;
		}
	});
	
	Handlebars.registerHelper("admin", function() {
		return Meteor.user().roles.indexOf("admin") !== -1;
	});
}

if (Meteor.isServer) {
	Meteor.publish("users", function() {
		if(this.userId) {
			console.log("hi");
			return Meteor.users.find(this.userId, {fields: {username: 1, roles: 1}});
		}
	});	
}

Meteor.methods({
	findSchool: function(hostname) {
		return Schools.findOne({hostname: hostname});
	}
});
