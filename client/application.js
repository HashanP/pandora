UsersAdmin = new Mongo.Collection("/admin/users");
RoomsAdmin = new Mongo.Collection("/admin/rooms");
school = new ReactiveVar();
wnd = new ReactiveVar(window.location);

Meteor.subscribe("users");
Meteor.subscribe("rooms");
