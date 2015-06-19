Template.login.events({
	"form submit": function(e) {
		e.preventDefault();
		Meteor.loginWithPassword(Template.instance().find(".username").value, Template.instance().find(".password").value);
	}
});



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


