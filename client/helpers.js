Handlebars.registerHelper("admin", function() {
	return Meteor.user().roles.indexOf("admin") !== -1;
});

Handlebars.registerHelper("eq", function(a, b) { 
	return a === b;
});
