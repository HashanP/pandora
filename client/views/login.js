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

var search = function(folder, searc) {
	var results = [];
	folder.forEach(function(n) {
		if(n.type === "file") {
			var p = Files.findOne(n._id);
			if(p && p.name().match(new RegExp(searc, "i"))) {
				results.push(n);
			} 
		} else {
			results = results.concat(search(n.files, searc));
		}
	});
	return results;
};

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
	},
	filesF: function() {
		if(!Session.get("search")) {
			return Template.instance().data.files;
		} else {
			return search(Template.instance().data.files, Session.get("search"));
		}
	},
	search: function() {
		return Session.get("search");
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
		var x = this.name();
		window.setTimeout(function() {
			$(".input-rename").val(x).focus();
			$(".input-rename").get(0).selectionStart = 0;
			$(".input-rename").get(0).selectionEnd = x.split(".")[0].length;
		}, 0);
	},
	"click .rename-folder": function() {
		Session.set("active", this.name);
		var x = this.name;
		window.setTimeout(function() {
			$(".input-rename-folder").val(x).focus();
			$(".input-rename-folder").get(0).selectionStart = 0;
			$(".input-rename-folder").get(0).selectionEnd = x.length;
		});
	},
	"blur .input-rename": function() {
		if($(".input-rename").val() !== "") {
			Meteor.call("fileRename", this._id, $(".input-rename").val());	
		}
		Session.set("active", undefined);
	},
	"blur .input-rename-folder": function() {
		if($(".input-rename-folder").val() !== "") {
			Meteor.call("folderRename", Template.instance().data._id, Session.get("path"), this.name, $(".input-rename-folder").val());	
		}
		Session.set("active", undefined);
	},
	"click .del": function() {
		Meteor.call("delFolder", Template.instance().data._id, Session.get("path"), this.name);
	},
	"keyup .search": function() {
		var y =	Template.instance().$(".search").val();
		if(y === "") {
			Router.go("/rooms/" + Template.instance().data._id + "/files");
		} else {
			Router.go("/rooms/" + Template.instance().data._id + "/files?search=" + Template.instance().$(".search").val());
		}
	}
});

Template.files.onCreated(function() {
	this.subscribe("files", this.data._id);
});

Template.navigation.helpers({
	"isNavActive": function(a) {
		return Session.equals("navActive", a);
	}
});
