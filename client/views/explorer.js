Template.search.helpers({
	search: function() {
		return Session.get("search");
	}
});

Template.search.events({
	"keyup .search": function() {
		var y =	Template.instance().$(".search").val();
		if(y === "") {
			Router.go("/rooms/" + Template.instance().data._id + "/files");
		} else {
			Router.go("/rooms/" + Template.instance().data._id + "/files?search=" + Template.instance().$(".search").val());
		}
	}
});

Template.tools.helpers({
	noOfActive: function() {
		return Session.get("noOfActive");
	}
});

Template.tools.events({
	"click .rename": function() {
		var x = $("tr.active .filename").text().trim(); 
		Session.set("old", x);
		Session.set("active", x);
		window.setTimeout(function() {
			$(".input-rename").val(x).focus();
			$(".input-rename").get(0).selectionStart = 0;
			$(".input-rename").get(0).selectionEnd = x.split(".")[0].length;
		}, 0);
	},
	"click .del": function(e) {
		e.stopPropagation();
		var n = _.map($("tr.active"), function(e) {
			return $(e).find(".filename").text().trim();
		});
		var y = Template.instance();
		swal({
			title: "Are you sure?",
			showCancelButton: true,
			confirmButtonClass: "btn-danger",
			confirmButtonText: $("tr.active").length === 1 ? "Yes, delete it!" : "Yes, delete them!",
			closeOnConfirm: true
		},
		function(isConfirm){
			if(isConfirm) {
				n.forEach(function(b) {
					Meteor.call("del", y.data._id, Session.get("navActive"), Session.get("path"), b);
				});
			}
		});
	},
	"click .create-folder": function() {
		Session.set("newFolder", true);
		window.setTimeout(function() {
			$(".input-create-folder").focus();
		}, 0);
	}
});

Template.explorer.events({
	"click tbody tr td:not(.bb-rename)": function(e) {
		if($(e.target).is("input")) {
			return true;
		}
		e.stopPropagation();
		document.getSelection().removeAllRanges();
		if(!(e.ctrlKey || e.metaKey || e.shiftKey)) {
			$(e.target).closest("tr").siblings().removeClass("active");
		}
		if(e.shiftKey) {
			var sep = $(e.target).closest("tr");
			var pre = $(e.target).closest("tr").prevAll(".active");
			var nex = $(e.target).closest("tr").nextAll(".active");
			if(!(pre.length === 0 && nex.length === 0)) {
				if(pre.length !== 0 && nex.length !== 0) {
					if((sep.index() - pre.index()) >= (nex.index() - sep.index())) {
						sep.nextUntil(nex).addClass("active");
					} else {
						pre.nextUntil(sep).addClass("active");	
					}
				} else {
					if(pre.length === 0) {
						sep.nextUntil(nex).addClass("active");
					} else {
						pre.nextUntil(sep).addClass("active");
					}
				}
			}
		}
		$(e.target).closest("tr").addClass("active");
		$(".circle").text($("tr.active").length);
		Session.set("noOfActive", $("tr.active").length);
	},
	"dragstart tr": function(e) {
		if(!$(e.target).is(".active")) {
			$(e.target).closest("tr").siblings().removeClass("active");
			$(e.target).addClass("active");	
		}
		$(".circle").text($("tr.active").length);
		Session.set("noOfActive", $("tr.active").length);
	},
	"drop tr.folder": function(e, ui) {
/*if (!$(e.srcElement).hasClass("ui-draggable-dragging")) { return; }*/
		e.preventDefault();
		if(!$(e.target).is(".active")) {
			Meteor.call("drop", Template.instance().data._id, Session.get("navActive"), Session.get("path"), $(e.target).find(".filename").text(), _.map($("tr.active"), function(el) {
				return $(el).find(".filename").text().trim();
			}));
		}
	},
	"dblclick tbody tr": function(e) {
		if($(e.target).is("input")) {
			return;
		}
		if(this.type === "file") {
			var a = document.createElement("a");
			a.href = Files.findOne(this._id).url();
			a.click();
		} else if(this.type === "link") {
			var a = document.createElement("a");
			a.href = this.url;
			a.click();
		} else {
			$("tr.active").removeClass("active");
			Router.go("/rooms/" + Template.instance().data._id + "/" + Session.get("navActive") + (Session.get("path") === "/" ? "/" : "/" + Session.get("path") + "/") + this.name);
		}
	},
	"mousedown tr": function(e) {
		if($(e.target).is("input")) {
			return true;
		}
		e.preventDefault();
	},
	"click .cancel-create": function() {
		Session.set("newFolder", false);
	},
	"blur .input-create-folder": function() {
		var p = Template.instance().$(".input-create-folder").val();
		if(p !== "") {
			if(nameValidation(p)) {
				Meteor.call("createFolder", Template.instance().data._id, Session.get("navActive"), Session.get("path"), p);
			}
		}
		Session.set("newFolder", false);
	},
	"keyup .input-create-folder, keyup .input-rename": function(e) {
		if(e.keyCode === 13) {
			$(e.target).trigger("blur");
		}
	},
	"blur .input-rename": function() {
		var p = $(".input-rename").val();
		if(p !== "" && p !== Session.get("old")) {
			if(nameValidation(p)) {
				Meteor.call("rename", Template.instance().data._id, Session.get("navActive"), Session.get("path"), Session.get("old"), p);	
			}
		}
		Session.set("active", undefined);
	}
});

Template.uploadStatus.helpers({
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
	errors: function() {
		return Session.get("errors");
	},
	show: function() {
		return Session.get("errors").length || Session.get("filesBeingUploaded").length;
	}
});

Template.files.helpers({
	path: function() {
		var x = Session.get("path");
		if(x !== "/") {
			return "/" + x + "/";
		} else {
			return x;
		}
	}
});

Template.breadcrumb.helpers({
	pathSplit: function() {
		var x = Session.get("path").split("/");
		if(Session.equals("navActive", "files")) {
			var results = [{name: "Files", p: ""}];
		} else {
			var results = [{name: "Quizzes", p:""}];
		}
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
	navActive: function() {
		return Session.get("navActive");
	}	
});

Template.item.helpers({
	isFolder: function() {
		return this.type === "folder" || this.type === "link";
	},
	isLink: function() {
		return this.type === "link";
	},
	isActive: function(a) {
		return Session.equals("active", a);
	},
	iconClass: function() {
		var t = _.last(this.name.split("."));
		if(this.type === "folder") {
			return "fa-folder-o";
		} else if(this.type === "link") {
			return "fa-link";
		} else if(this.type === "quiz") {
			return "fa-pencil-square-o";	
		} else if(Files.findOne(this._id).isAudio()) {
			return "fa-file-audio-o";
		} else if(Files.findOne(this._id).isImage()) {
			return "fa-file-image-o";
		} else if(Files.findOne(this._id).isVideo()) {
			return "fa-file-video-o";
		} else if(codeExtensions.indexOf(t) !== -1) {
			return "fa-file-code-o";
		} else if("doc docx odt fodt".split(" ").indexOf(t) !== -1) {
			return "fa-file-word-o";
		} else if("xls xlsx ods fods".split(" ").indexOf(t) !== -1) {
			return "fa-file-excel-o";
		} else if("ppt pptx odp fodp".split(" ").indexOf(t) !== -1) {
			return "fa-file-powerpoint-o";
		} else if(t === "pdf") {
			return "fa-file-pdf-o";
		} else if(t === "txt") {
			return "fa-file-text-o";
   	} else {
			return "fa-file-o";
		}
	}
});

var codeExtensions = "java c cpp py js json yaml cs vb html css swift rb hs erl".split(" ");

var c = function(e) {
	$("tr.active").removeClass("active");
	Session.set("noOfActive", 0);
};

Template.explorer.onRendered(function() {
	$("body").on("click", c);
});
	
Template.item.onRendered(function() {
	Template.instance().$("tr").draggable({
		helper: function() {
			return $(".circle").clone().show();
		},
		cursorAt: {
			top: -23,
			left: -23
		},
		containment: ".contents",
		distance: 10
	});
	Template.instance().$("tr.folder").droppable({
		hoverClass:"ui-hover",
		tolerance: "pointer"
	});
});

Template.explorer.onDestroyed(function() {
	$("body").unbind("click", c);
});

var nameValidation = function(p) {
	if(p.length > 255) {
		swal("Name too long", "File and folder names cannot be longer than 255 characters");
	} else if(p.indexOf("/") !== -1) {
		swal("Name contains /", "Folder names cannot contain forward slashes");
	} else if(_.findWhere(getFiles(), {name: p})) {
		swal("Another file or folder has the same name", "Please choose a different name");	
	} else {
		return true;
	} 
};

Template.files.events({
	"click .upload": function() {
		$("tr.active").removeClass("active");
		var y = Template.instance();
		var fileEl = document.createElement("input");
		fileEl.multiple = true;
		$("body").append(fileEl);
		fileEl.type = "file";
		Session.set("errors", []);
		fileEl.addEventListener("change", function(e) { 
			FS.Utility.eachFile(e, function(file) {
				file = new FS.File(file);
				if(_.findWhere(getFiles(), {name: file.name(), type: "folder"})) {
					var errors = Session.get("errors");
					errors.push({name:file.name()});
					return Session.set("errors", errors);
				}
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
		Session.set("errors", []);
	},
	"click .add-link": function() {
		Modal.show("newLink", Template.instance().data);
	}
}); 

var URL_REGEX= /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;

Template.newLink.events({
	"click .submit": function() {
		var name = $(".name").val();
		var url = $(".url").val();
		if (!/^https?:\/\//i.test(url)) {
			url = 'http://' + url;
		}
		if(!URL_REGEX.test(url)) {
			return Session.set("error", "URL not valid.");
		} else if(name.trim() === "") {
			return Session.set("error", "Name cannot be empty.");
		}
		Meteor.call("addLink", Template.instance().data._id, Session.get("path"), {
			name: name,
			url: url
		});
		Modal.hide("addLink");
	}
});

Template.newLink.helpers({
	"error": function() {
		return Session.get("error");
	}
});

Template.files.onCreated(function() {
	this.subscribe("files", this.data._id);
});

Template.notices.onCreated(function() {
	this.autorun(function() {
		if(this.data) {
			this.subscribe("noticeFiles", this.data._id);
		}
	});
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

var getFiles = function() {
	if(!Session.get("search")) {
		return _.sortBy(Session.get("files"), "name");
	} else {
		return _.sortBy(search(Session.get("files"), Session.get("search")), "name");
	}
};

Template.explorer.helpers({
	newFolder: function() {
		return Session.get("newFolder");
	},
	filesF: function() {
		if(!Session.get("search")) {
			return _.sortBy(Template.instance().data.files, "name");
		} else {
			return _.sortBy(search(Template.instance().data.files, Session.get("search")), "name");
		}
	}
});

