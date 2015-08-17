Template["/admin/users"].helpers({
	"isAdmin": function() {
		return Template.currentData().roles && Template.currentData().roles.indexOf("admin") !== -1;
	},
	"users": function() {
		return UsersAdmin.find({}, {sort: ["username"]});
	},
	"count": function() {
		return Counts.get("users");
	}
});

Template.base.helpers({
	"yp": function() {
		return wnd.get().pathname.indexOf("/rooms") === 0 ? "room" : "other";
	}
});

Template["/admin/rooms"].helpers({
	"rooms": function() {
		return RoomsAdmin.find({}, {sort: ["title"]});
	},
	"count": function() {
		return Counts.get("rooms");
	}	
});

Template.pagination.helpers({
	"nextPage": function() {
		return Session.get("page") + 1;
	},
	"prevPage": function() {
		return Session.get("page") - 1;
	},
	"isPage": function(n) {
		return Session.equals("page", n);	
	},
	"pages": function() {
		return _.range(1, Math.ceil(Session.get("count")/10)+1);
	},
	"firstPage": function() {
		return Session.get("offset") === 0;
	},
	"lastPage": function() { 
		return Session.get("offset") >= Session.get("count") - 10;
	}
});

Template["/admin/users"].events({
	"click .del": function() {
		Meteor.users.remove(this._id);
		if(Session.get("offset") === Counts.get("users") - 1 && Session.get("page") !== 1) {
			Router.go("/admin/users?page=" + (Session.get("page") -1));
		}
	},
	"keyup .search": function(e) {
		if(e.target.value.trim() !== Session.get("search").trim()) {
			if(e.target.value.trim() === "") {
				Router.go("/admin/users");
			} else {
				Router.go("/admin/users?search=" + e.target.value.trim());
			}
		}
	}
});

Template["/admin/rooms"].events({
	"keyup .search": function(e) {
		if(e.target.value.trim() !== Session.get("search").trim()) {
			if(e.target.value.trim() === "") {
				Router.go("/admin/rooms");
			} else {
				Router.go("/admin/rooms?search=" + e.target.value.trim());
			}
		}
	},
	"click .del": function() {
		Rooms.remove(this._id);
		if(Session.get("offset") === Counts.get("rooms") - 1 && Session.get("page") !== 1) {
			Router.go("/admin/rooms?page=" + (Session.get("page")-1));
		}
	}
});

Template["/admin/users"].onCreated(function() {
	Tracker.autorun(function() {
		this.subscribe("/admin/users", Session.get("offset"), Session.get("limit"), Session.get("search"));	
		this.subscribe("/admin/users/count", Session.get("search"));
	}.bind(this));
});

Template["/admin/rooms"].onCreated(function() {
	Tracker.autorun(function() {
		this.subscribe("/admin/rooms", Session.get("offset"), Session.get("limit"), Session.get("search"));
		this.subscribe("/admin/rooms/count", Session.get("search"));
	}.bind(this));
});

Template["/admin/rooms/create"].events({
	"submit form": function(e) {
		e.preventDefault();
		var title = Template.instance().$(".title").val();
		if(title === "") {
			return Session.set("error", "Title cannot be empty.");
		}
		var obj = {
			title: title,
			type: Template.instance().$(".type").val(),
			students: $(".students").select2("val"),
			teachers: $(".teachers").select2("val")
		};
		if(this._id) {
			Rooms.update({_id: this._id}, {$set: obj});
		} else {
			obj.schoolId = Meteor.user().schoolId;
			Rooms.insert(obj, function(err) {
				if(err) {
					Session.set("error", "Another room has the same title; you must choose a different one.");
				} else {
					Router.go("/admin/rooms");
				}
			});
		}	
	}
});

Template["/admin/users/create"].onRendered(function() {
	var opts = {
		placeholder:"None",
		minimumInputLength:1,
		multiple:true,
		query: function(params) {
			Meteor.call("findRooms", params.term, function(err, results) {
				params.callback({
					results: _.map(results, function(result) {
						return {id: result._id, text: result.title};
					})
				});
			});
		},
		initSelection: function(el, cb) {
			if($(el).val() === "") {
				return cb([]);
			}
			var ids = $(el).val().split(",");
			var results = [];
			var count = 0;
			ids.forEach(function(id) {
				Meteor.call("findRoom", id, function(err, user) {
					results.push({id: id, text: user.title});
					count++;
					if(count === ids.length) {
						cb(results);
					}
				});
			});	
		}.bind(this)
	};

	Template.instance().$(".subjects-read").select2(opts).select2("val", this.data ? _.pluck(this.data.students, "_id") : []);
	Template.instance().$(".subjects-write").select2(opts).select2("val", this.data ? _.pluck(this.data.teachers, "_id") : []);

	Template.instance().$(".subjects-read").on("change", function(e) {
		console.log(e);
		$(".subjects-write").select2("val", _.without.apply(_, [$(".subjects-write").select2("val")].concat(e.val)));
	});

	Template.instance().$(".subjects-write").on("change", function(e) {
		console.log(e);
		$(".subjects-read").select2("val", _.without.apply(_, [$(".subjects-read").select2("val")].concat(e.val)));
	});

	Template.instance().$(".subjects-read, .subjects-write").on("select2-close", function() {
		$(".select2-focused").blur();
	});
});

Template["/admin/rooms/create"].onRendered(function() {
	var opts = {
		placeholder: "None",
		minimumInputLength:1,
		multiple:true,
		query: function(params) {
			Meteor.call("findUsers", params.term, function(err, results) {
				params.callback({
					results: _.map(results, function(result) {
						return {id: result._id, text: result.username};
					})
				});
			});
		},
		initSelection: function(el, cb) {
			if($(el).val() === "") {
				return cb([]);
			}
			var ids = $(el).val().split(",");
			var results = [];
			var count = 0;
			console.log(ids);
			ids.forEach(function(id) {
				Meteor.call("findUser", id, function(err, user) {
					results.push({id: id, text: user.username});
					count++;
					if(count === ids.length) {
						cb(results);
					}
				});
			});	
		}
	};

	Template.instance().$(".students").select2(opts).select2("val", this.data ? this.data.students : []);
	Template.instance().$(".teachers").select2(opts).select2("val", this.data ? this.data.teachers : []);

	Template.instance().$(".students").on("change", function(e) {
		$(".teachers").select2("val", _.without.apply(_, [$(".teachers").select2("val")].concat(e.val)));
	});

	Template.instance().$(".teachers").on("change", function(e) {
		$(".students").select2("val", _.without.apply(_, [$(".students").select2("val")].concat(e.val)));
	});

	Template.instance().$(".students, .teachers").on("select2-close", function() {
		$(".select2-focused").blur();
	});
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
		if(username === "") {
			return Session.set("error", "Username cannot be empty.");
		}
		if(Session.equals("howToChoosePassword", "username")) {
			var password = username;
		} else if(Session.equals("howToChoosePasssword", "dateOfBirth")) {
			var password = formatDate(Template.instance().$(".dateOfBirth").val());
		} else if(Session.equals("howToChoosePassword", "custom")) {
			var password = Template.instance().$(".password").val();
		}
		var readSubjects = $(".subjects-read").select2("val");
		var writeSubjects = $(".subjects-write").select2("val");
		Meteor.call("createUser2", username, password, readSubjects, writeSubjects, Template.instance().data ? Template.instance().data._id : undefined, function(y, b) {
			if(y) {
				Session.set("error", y.reason);
			} else {
				Router.go("/admin/users");
			}
		});
	}
});

Template["/admin/users/create"].helpers({
	"howToChoosePassword": function() {
		return Session.get("howToChoosePassword");
	},
	"error": function() {
		return Session.get("error");
	}
});

Template["/admin/rooms/create"].helpers({
	"error": function() {
		return Session.get("error");
	}
});
