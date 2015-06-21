Handlebars.registerHelper("admin", function() {
	return Meteor.user().roles.indexOf("admin") !== -1;
});

Handlebars.registerHelper("eq", function(a, b) { 
	return a === b;
});

Handlebars.registerHelper("not", function(a) {
	return !a;
});

Handlebars.registerHelper("formatArray", function(a) {
	return JSON.stringify(a);
});
