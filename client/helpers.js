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

UI.registerHelper("britishDate", function(date) {
  return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
});

UI.registerHelper("localDate", function(date) {
	return date.toLocaleTimeString() + " " + date.toLocaleDateString();
});

UI.registerHelper("humanFileSize", function(bytes) {
    var thresh = 1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = ['kB','MB','GB','TB','PB','EB','ZB','YB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
});

UI.registerHelper("GeoPattern", function(title) {
	return new Spacebars.SafeString(GeoPattern.generate(title).toDataUri());
});

var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

UI.registerHelper("fullDate", function(date) {
	return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
});

UI.registerHelper('withIndex', function(x) {
	console.log(x);
	return x.map(function(y, i) {
		return _.extend(y, {index: i});
	}); 
});
