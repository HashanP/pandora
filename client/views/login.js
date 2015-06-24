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

Template.base.helpers({
	subjects: function() {
		return Rooms.find({type: "subject"}).fetch();
	}
});

Template["/notices/create/post"].onRendered(function() {
	$("#summernote").summernote();
});

Template["/notices/create/post"].events({
	"submit form": function(e) {
		e.preventDefault();
		Meteor.call("insertPost", Template.instance().data._id, Template.instance().$(".title").val(), Template.instance().$(".note-editable").html());
		Router.go("/rooms/" + Template.instance().data._id + "/notices");
	}
});

Template.files.helpers({
	filesBeingUploaded: function() {
		return Session.get("filesBeingUploaded");
	},
	finished: function() {
		var files = Session.get("filesBeingUploaded");
		for(var i = 0; i < files.length; i++) {
			var f = Files.findOne(files[i]);
			if(!f || !f.isUploaded()) {
				return false;
			}
		}
		return true;
	},
	newFolder: function() {
		return Session.get("newFolder");
	},
	isFolder: function() {
		return this.type === "folder";
	},
	path: function() {
		var x = Session.get("path");
		if(x !== "/") {
			return "/" + x + "/";
		} else {
			return x;
		}
	},
	pathSplit: function() {
		var x = Session.get("path").split("/");
		var results = [{name: "Files", p: ""}];
		if(Session.get("path") !== "/") {
			var current = "";
			x.forEach(function(folder) {
				current += "/" + folder;
				results.push({
					name: folder,
					p: current,
					active: false	
				});
			});
		}
		results[results.length-1].active = true;
		return results;
	},
	isActive: function(a) {
			console.log(a);
			return Session.equals("active", a);
	}
});

Template.files.events({
	"click .upload": function() {
		var y = Template.instance();
		var fileEl = document.createElement("input");
		$("body").append(fileEl);
		fileEl.type = "file";
		fileEl.addEventListener("change", function(e) { 
			FS.Utility.eachFile(e, function(file) {
				file = new FS.File(file);
				file.owner = y.data._id;
				file.schoolId = y.data.schoolId;
				file.category = "resource";
				file.path = Session.get("path");
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
	"click .done": function() {
		Session.set("filesBeingUploaded", []);
	},
	"click .create-folder": function() {
		Session.set("newFolder", true);
		window.setTimeout(function() {
			$(".input-create-folder").focus();
		}, 0);
	},
	"click .cancel-create": function() {
		Session.set("newFolder", false);
	},
	"blur .input-create-folder": function() {
		if(Template.instance().$(".input-create-folder").val() !== "") {
			Meteor.call("createFolder", Template.instance().data._id, Session.get("path"), Template.instance().$(".input-create-folder").val());
		}
		Session.set("newFolder", false);
	},
	"click .rename": function() {
		Session.set("active", this._id);
		window.setTimeout(function() {
			$(".input-rename").focus();
		}, 0);
	},
	"blur .input-rename": function() {
		if($(".input-rename").val() !== "") {
			console.log(this);
			Meteor.call("fileRename", this._id, $(".input-rename").val());	
		}
		Session.set("active", undefined);
	}
});

Template.files.onCreated(function() {
	this.subscribe("files", this.data._id);
});
