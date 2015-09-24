if (window.getSelection && document.createRange) {
	saveSelection = function(containerEl) {
		var range = window.getSelection().getRangeAt(0);
			var preSelectionRange = range.cloneRange();
			preSelectionRange.selectNodeContents(containerEl);
			preSelectionRange.setEnd(range.startContainer, range.startOffset);
			var start = preSelectionRange.toString().length;

			return {
					start: start,
					end: start + range.toString().length
			};
	};

	restoreSelection = function(containerEl, savedSel) {
			var charIndex = 0, range = document.createRange();
			range.setStart(containerEl, 0);
			range.collapse(true);
			var nodeStack = [containerEl], node, foundStart = false, stop = false;

			while (!stop && (node = nodeStack.pop())) {
					if (node.nodeType == 3) {
							var nextCharIndex = charIndex + node.length;
							if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
									range.setStart(node, savedSel.start - charIndex);
									foundStart = true;
							}
							if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
									range.setEnd(node, savedSel.end - charIndex);
									stop = true;
							}
							charIndex = nextCharIndex;
					} else {
							var i = node.childNodes.length;
							while (i--) {
									nodeStack.push(node.childNodes[i]);
							}
					}
			}

			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
	}
} else if(document.selection) {
	saveSelection = function(containerEl) {
		var selectedTextRange = document.selection.createRange();
		var preSelectionTextRange = document.body.createTextRange();
		preSelectionTextRange.moveToElementText(containerEl);
		preSelectionTextRange.setEndPoint("EndToStart", selectedTextRange);
		var start = preSelectionTextRange.text.length;

		return {
				start: start,
				end: start + selectedTextRange.text.length
		}
	};

	restoreSelection = function(containerEl, savedSel) {
			var textRange = document.body.createTextRange();
			textRange.moveToElementText(containerEl);
			textRange.collapse(true);
			textRange.moveEnd("character", savedSel.end);
			textRange.moveStart("character", savedSel.start);
			textRange.select();
	};
}

Template.login.events({
	"click .login-button": function(e) {
		Meteor.loginWithPassword(Template.instance().find(".username").value, Template.instance().find(".password").value, function(err) {
			console.log(err);
		});
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

Template.base.helpers({
	subjects: function() {
		return Rooms.find({type: "subject"}).fetch();
	}
});

Template.navbar.helpers({
	username: function() {
		return Meteor.user().username;
	},
	navbarActive: function() {
		return Session.get("navbarActive");
	}
});

Template.navbar.events({
	"click .logout": function() {
		Meteor.logout();
	}
});

Template.adminNav.helpers({
	adminActive: function() {
		return Session.get("adminActive");
	}
});

Template.settings.events({
	"click .change-password": function() {
		if($(".new-password").val() === "") {
			Session.set("error", "New password cannot be blank.");
		} else if($(".new-password").val() !== $(".confirm-password").val()) {
			Session.set("error", "New password and confirm new password are not the same.");	
		} else {
			Accounts.changePassword($(".current-password").val(), $(".confirm-password").val(), function(err) {
				if(err) {
					Session.set("error", err.reason + ".");
				} else {
					$(".new-password").val("");
					$(".confirm-password").val("");
					$(".current-password").val("");
					Session.set("success", "Your password has been changed.");
				}
			});
		}
	}
});

Template.settings.helpers({
	error: function() {
		return Session.get("error");
	},
	success: function() {
		return Session.get("success");
	}
});

Template.navigation.onCreated(function() {
	this.subscribe("notices", this.data._id);
});

Template.home.helpers({
	joined: function(id) {
		return Rooms.findOne(id).students.indexOf(Meteor.userId()) !== -1;
	},
	teacher: function(id) {
		return Rooms.findOne(id).teachers.indexOf(Meteor.userId()) !== -1;
	}
});

Template.home.events({
	"click .join": function() {
		Meteor.call("join", this._id);
	},
	"click .unjoin": function() {
		Meteor.call("unjoin", this._id);
	}
});

Template.noticeNav.helpers({
	events: function() {
		return _.sortBy(Reminders.find({roomId: Template.currentData()._id}).fetch().concat(Assignments.find({roomId: Template.currentData()._id}).fetch()), function(x) {
			return x.type === "reminder" ? x.eventDate : x.deadline;
		});
	}
});

UI.registerHelper("isNavActive", function(a) {
	return Session.equals("navActive", a);
});
