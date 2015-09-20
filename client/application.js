UsersAdmin = new Mongo.Collection("/admin/users");
RoomsAdmin = new Mongo.Collection("/admin/rooms");
school = new ReactiveVar();
wnd = new ReactiveVar(window.location);

Meteor.autorun(function() {
	if(Meteor.user()) {
		Meteor.subscribe("users");
		Meteor.subscribe("rooms");
	}
});
