Template.createPoll.events({
	"click .add-option": function(e) {
		Blaze.render(Template.pollOption, e.target.parentNode.parentNode, e.target.parentNode, Template.instance()); 
	},
	"click .remove-option": function(e) {
		$(e.target).closest(".option").remove();
	},
	"click .submit": function() {
		var title = $(".text").val();
		var p = _.map($(".option input"), function(el) {
			return $(el).val();
		});
		if(title === "") {
			return Session.set("error", "Title cannot be empty.");
		} else if(title.length > 400) {
			return Session.set("error", "Title cannot be longer than 400 characters.");
		}
		if(p.length < 2) {
			return Session.set("error", "There must be at least 2 options.");
		} else if(p.length > 10) {
			return Session.set("error", "There cannot be more than 10 options.");
		}
		for(var i = 0; i < p.length; i++) {
			if(p[i].trim() === "") {
				return Session.set("error", "Options cannot be empty.");
			} else if(p[i].length > 100) {
				return Session.set("error", "Options cannot be longer than 100 characters.");
			}
		}
		var t = p.map(function(x) {
			return {title: x, votes:0};
		});
		Polls.insert({
			text: title,
			date: new Date(Date.now()),
			comments: [],
			allowComments: true,
			pollOptions: t,
			roomId: Template.instance().data._id,
			userId: Meteor.userId(),
			voted: []
		});		
		Router.go("/rooms/" + Template.instance().data._id);
	}
});

Template.createReminder.events({
	"click .submit": function() {
		if($(".text").val() === "") {
			return Session.set("error", "Event name cannot be empty.");
		} else if($(".text").val().length > 200) {
			return Session.set("error", "Event name cannot be longer than 200 characters.");
		} else if($(".eventDate").val() === "") {
			return Session.set("error", "Event date cannot be empty.");
		}
		if(!Template.instance().data.reminderId) {
			Reminders.insert({
				date: new Date(Date.now()),
				eventDate: new Date($(".eventDate").val()),
				text: $(".text").val(),
				comments: [],
				allowComments: true,
				roomId: Template.instance().data._id,
				userId: Meteor.userId()	
			});
		} else {
			Reminders.update(Template.instance().data.reminderId, {
				$set: {
					eventDate: new Date($(".eventDate").val()),
					text: $(".text").val()
				}
			});
		}
		Router.go("/rooms/" + Template.instance().data._id);
	}
});

Template.createAssignment.helpers({
	obj: function() {
		return Assignments.findOne(Template.instance().data.assignmentId);
	}
});

Template.createReminder.helpers({
	obj: function() {
		if(Template.instance().data.reminderId) {
			return Reminders.findOne(Template.instance().data.reminderId);
		}
	}
});

Template.createAssignment.events({
	"click .submit": function() {
		if($(".text").val() === "") {
			return Session.set("error", "Details cannot be empty.");
		} else if($(".text").val().length > 4000) {
			return Session.set("error", "Details cannot be longer than 4000 characters.");		
		} else if($(".dueDate").val() === "") {
			return Session.set("error", "Due date cannot be empty.");
		}
		if(!Template.instance().data.assignmentId) {
			Assignments.insert({
				text: $(".text").val(),
				comments: [],
				allowComments: true,
				roomId: Template.instance().data._id,
				userId: Meteor.userId(),
				deadline: new Date($(".dueDate").val()),
				date: new Date(Date.now()),
				uploads: [],
				uploadViaPandora: $(".uploadViaPandora").is(":checked")
			});		
		} else {
			var obj = {
				text: $(".text").val(),
				deadline: new Date($(".dueDate").val()),
				uploadViaPandora: $(".uploadViaPandora").is(":checked")
			};
			Assignments.update(Template.instance().data.assignmentId, {
				$set: obj
			});
		}
		Router.go("/rooms/" + Template.instance().data._id);
	}
});

Template["/announcement"].onCreated(function() {
	window.images = new ReactiveArray();	
	window.youtubes = new ReactiveArray();
	var data = this.data;
	if(data.announcementId) {
		this.autorun(function() {
			var announcement = Notices.findOne(data.announcementId)
			if(announcement) {
				announcement.images.forEach(function(x) {
					images.push(x);
				});
				announcement.youtubes.forEach(function(x) {
					youtubes.push(x);
				});
			}
		});
	}
});

Template["/announcement"].onRendered(function() {
	Template.instance().$(".text").autosize();
});

Template["/announcement"].events({
	"click .add-image": function(e) {
		console.log(e.target);
		$(e.target).blur();
		var fileEl = document.createElement("input");
    fileEl.type = "file";
		fileEl.accept = "image/*";
    fileEl.addEventListener("change", function() {
			if(fileEl.files[0].size < 3 * 1024 * 1024) {	
				var reader = new FileReader();
				reader.addEventListener("load", function(e) {
					images.push({
						data: e.target.result,
						title: fileEl.files[0].name
					}); 
				}.bind(this));
				reader.readAsDataURL(fileEl.files[0]);
			} else {
				Modal.show("fileSizeTooBig");
			}
		}.bind(this)); 
		fileEl.click();
	},
	"click .add-youtube": function(e) {
		console.log(e.target);
		$(e.target).blur();
		var id = Iron.Url.parse($(".youtube-url").val()).queryObject.v;
		$.getJSON("https://noembed.com/embed?url=http%3A//www.youtube.com/watch%3Fv%3D" + id + "&callback=?", function(result) {
			var title = result.title;
			youtubes.push({
				id: id,
				title: title
			});
		});
		$("#youtube").modal("hide");
		$(".youtube-url").val("");
	},
	"click .remove-youtube": function() {
		youtubes.splice(this.index, 1);
	},
	"click .submit": function() {
		var text = $(".text").val();
		if(text === "" && youtubes.length === 0 && images.length === 0) {
			return Session.set("error", "Post cannot contain nothing.");
		} else if(text.length > 4000) {
			return Session.set("error", "Post cannot be longer than 4000 characters.");
		}
		if(!Template.instance().data.announcementId) {
			Notices.insert({
				text: text,
				date: new Date(Date.now()),
				roomId: Template.instance().data._id,
				allowComments: true,
				comments: [],
				youtubes: Array.prototype.slice.call(youtubes.list()),
				images: Array.prototype.slice.call(images.list()),
				userId: Meteor.userId()
			});
		} else {
			Notices.update(Template.instance().data.announcementId, {$set: {
				text: text,
				youtubes: Array.prototype.slice.call(youtubes.list()),
				images: Array.prototype.slice.call(images.list())
			}});
		}
		Router.go("/rooms/" + Template.instance().data._id);
	}
});

Template["/announcement"].helpers({
	"images": function() {
		return images.list();
	},
	youtubes: function() {
		return youtubes.list();
	},
	value: function() {
		console.log(Notices.findOne(Template.instance().data.announcementId));
		if(Template.instance().data.announcementId) {
			return Notices.findOne(Template.instance().data.announcementId).text;
		}	
	}
});

Template.youtubeList.helpers({
	youtubeId: function() {
		return Session.get("youtubeId");
	}, 
	youtubeTitle: function() {
		return Session.get("youtubeTitle");
	}
});

Template.youtubeList.events({
	"click .show-youtube": function() {
		Session.set("youtubeId", this.id);
		Session.set("youtubeTitle", this.title);
		$("#show-youtube").modal("show");
	},
	"hide.bs.modal #show-youtube": function() {
		Session.set("youtubeId", "");
	}
});

Template.imageList.helpers({
	imageSrc: function() {
		return Session.get("imageSrc");
	},
	imageTitle: function() {
		return Session.get("imageTitle");
	}
});

Template.imageList.events({
	"click .remove-image": function() {
		images.splice(this.index, 1);
	},
	"click .show-image": function() {
		Session.set("imageSrc", this.data);
		Session.set("imageTitle", this.title);
		$("#show-image").modal("show");
	}
});

Template.assignment.helpers({
	uploads: function() {
		return Assignments.findOne(Template.instance().data.assignmentId).uploads;
	},
	feedback: function() {
		return this.grade !== undefined || this.comment !== undefined;
	}
});

Template.assignment.events({
	"click .open-feedback": function() {
		Modal.show("feedback", {grade: this.grade, comment: this.comment, userId: this.userId, assignmentId: Template.instance().data.assignmentId});
	}
});

Template.feedback.events({
	"click .save": function() {
		Meteor.call("feedback", Template.instance().data.assignmentId, Template.instance().data.userId, $(".grade").val(), $(".comment").val());
		Modal.hide("feedback");
	}
});

Template.notices.helpers({
	"isNotEmpty": function() {
		return Session.get("isNotEmpty");
	},
	activeNotice: function() {
		return Session.get("activeNotice");
	},
	"username": function(userId) {
		return Meteor.users.findOne(userId).username;
	},
	tooManyComments: function() {
		return this.comments.length > 3;
	},
	showAll: function() {
		return Session.get("showAll");
	},
	commentsF: function() {
		return Session.get("showAll") || this.comments.length < 3 ? this.comments : this.comments.slice(this.comments.length-3);
	},
	notices: function() {
		return _.sortBy(Notices.find().fetch().concat(Polls.find().fetch()).concat(Assignments.find().fetch()).concat(Reminders.find().fetch()), "date").reverse();
	},
	notDone: function() {
		return Rooms.findOne(Template.instance().data._id).students.length - this.uploads.length;
	},
	fff: function() {
		var t = _.findWhere(this.uploads, {userId: Meteor.userId()});
		console.log(t);
		if(t === undefined) {
			return {files: []};
		} else {
			return t;
		}
	},
	activeComment: function(x, z, y) {
		var pp = Session.get("activeComment");
		return pp.type === x && pp._id === z && pp.id === y;
	}
});

Template.notices.events({
	"click .del": function() {
		if(this.type === "notice") {
			Notices.remove(this._id);
		} else if(this.type === "poll") {
			Polls.remove(this._id);
		} else if(this.type === "reminder") {
			Reminders.remove(this._id);
		} else {
			Assignments.remove(this._id);
		}
	},
	"click .reply": function() {
		Session.set("activeNotice", this._id);
		window.setTimeout(function() {
			$("textarea").autosize();
		}, 0);
	},
	"click .submit-reply": function() {
		Meteor.call("reply", Template.instance().data._id, this._id, this.type, $(".reply-text").val());
		Session.set("activeNotice", undefined);
	},
	"click .show-all": function() {
		Session.set("showAll", !Session.get("showAll"));
	},
	"click .cancel-reply": function() {
		Session.set("activeNotice", undefined);
	},
	"click .del-reply": function(e) {
		console.log(e.target.dataset);
		Meteor.call("delComment", e.target.dataset.id, e.target.dataset.type, this.commentId);
	},
	"click .edit-reply": function(e) {
		Session.set("activeComment", {
			type: e.target.dataset.type,
			_id: e.target.dataset.id,
			id: this.commentId
		});
		window.setTimeout(function() {
			$(".edit-reply-field").focus();
		}, 0);
	},
	"click .hand-in": function(e) {
		var y = Template.instance();
		var c = this;
		var fileEl = document.createElement("input");
		$("body").append(fileEl);
		fileEl.type = "file";
		fileEl.addEventListener("change", function(e) { 
		FS.Utility.eachFile(e, function(file) {
			file = new FS.File(file);
			file.owner = y.data._id;
			file.schoolId = y.data.schoolId;
			file.category = "upload";
			file.userId = Meteor.userId();
			file.assignmentId = c._id;
			Files.insert(file, function(err, fileObj) {
				var files = Session.get("filesBeingUploaded");
				files.push(fileObj._id);
					Session.set("filesBeingUploaded", files);
				});
			});
			$(fileEl).remove();
		});	
		fileEl.click();
	},
	"blur .edit-reply-field": function() {
		var c = Session.get("activeComment");
		Meteor.call("editReply", c.type, c._id, c.id, $(".edit-reply-field").val());
		Session.set("activeComment", "");
	},
	"click .poll-submit": function(e) {
		console.log(this);
		var x = $(e.target).closest(".poll").find("input:checked");
		if(x.length === 0) {
			swal("You must select an option.");
		} else {
			Meteor.call("vote", this._id, $(e.target).closest(".poll").find("input:checked").val());
		}
	}
});

Template.assignment.onCreated(function() {
	this.subscribe("fa", this.data.assignmentId);
});

