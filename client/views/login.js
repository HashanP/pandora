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

Template["/subjects"].helpers({
	subjects: function() {
		return Rooms.find({type: "subject"}).fetch();
	}
});

Template.notices.onRendered(function() {
	var n = function() {
		console.log("hi");
		 $('.slimScrollBar, .slimScrollRail').remove();
		$(".super").slimScroll({
			height:($(window).height() - 76) + "px" 
		});
	};
	n();
	$(window).resize(function() {
		$(".super").unwrap();
		n();
	});
	if(this.data.text) {
		$(".create-text").modal("show")
	}
	$('[data-toggle="popover"]').popover();
});

Template.notices.events({
	"input .create-post": function(e) {
		Session.set("post", e.target.value);
	},
	"focus .create-post": function(e) {
		if(Session.get("post") === "") {
			e.target.rows = 3;
			$(e.target).autosize();
			Session.set("isNotEmpty", true);
		}
	},
	"blur .create-post": function(e) {
		console.log($(":focus"));
		if(Session.get("post") === "" && Session.get("modal") !== true) {
			$(e.target).off();
			e.target.style.height = "";
			e.target.rows = 1;
			Session.set("isNotEmpty", false);
		}
	},
	"click .youtube": function(e) {
		Session.set("modal", "true");
	},
	"click .submit": function() {
		Meteor.call("insertPost", this._id, $(".create-post").val());
		$(".create-post").val("").css("height", "").attr("rows", 1);
	},
	"click .del": function() {
		Meteor.call("removePost", Template.instance().data._id, this.noticeId);
	}	
});

Template.notices.helpers({
	"isNotEmpty": function() {
		return Session.get("isNotEmpty");
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

Template.item.helpers({
	isFolder: function() {
		return this.type === "folder";
	},
	isActive: function(a) {
			console.log(a);
			return Session.equals("active", a);
	}
});

var c = function() {
	$("tr.active").removeClass("active");
};

Template.files.onRendered(function() {
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
		containment: ".contents"
	});
	Template.instance().$("tr.folder").droppable({
		hoverClass:"ui-hover",
		tolerance: "pointer"
	});
});

Template.files.onDestroyed(function() {
	$("body").unbind("click", c);
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
		var p = $(".input-rename-folder").val();
		if(p !== "") {
			if(_.findWhere(Template.instance().data.files, {name: p}) !== undefined) {
				var c = 1;
				while(_.findWhere(Template.instance().data.files, {name:p + " (" + c + ")"}) !== undefined) {
					c++;
				} 
				p += " (" + c + ")";	
			}
			Meteor.call("folderRename", Template.instance().data._id, Session.get("path"), this.name, p);	
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
	},
	"click tr": function(e) {
		e.stopPropagation();
		document.getSelection().removeAllRanges();
		if(!(e.ctrlKey || e.metaKey || e.shiftKey)) {
			$(e.target).closest("tr").siblings().removeClass("active");
		}
		if(e.shiftKey) {
			var sep = $(e.target).closest("tr");
			var pre = $(e.target).closest("tr").prevAll(".active");
			var nex = $(e.target).closest("tr").nextAll(".active");
			console.log(sep.prevAll(".active"));
			console.log(sep.nextAll(".active"));
			if(!(pre.length === 0 && nex.length === 0)) {
				console.log("here");
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
	},
	"dragstart tr": function(e) {
		if(!$(e.target).is(".active")) {
			$(e.target).closest("tr").siblings().removeClass("active");
			$(e.target).addClass("active");	
		}
		$(".circle").text($("tr.active").length);
	},
	"drop tr.folder": function(e, ui) {
		e.preventDefault();
		if(!$(e.target).is(".active")) {
			Meteor.call("drop", Template.instance().data._id, Session.get("path"), $(e.target).find(".filename").text(), _.map($("tr.active"), function(el) {
				return $(el).find(".filename").text().trim();
			}));
		}
	},
	"dblclick tr": function(e) {
		if(this.type === "file") {
			var a = document.createElement("a");
			a.href = Files.findOne(this._id).url();
			a.click();
		} else {
			$("tr.active").removeClass("active");
			Router.go("/rooms/" + Template.instance().data._id + "/files" + (Session.get("path") === "/" ? "/" : "/" + Session.get("path") + "/") + this.name);
		}
	},
	"mousedown tr": function(e) {
		e.preventDefault();
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
		Meteor.call("insertPost", Template.instance().data._id, $(".text").val(), Array.prototype.slice.call(youtubes.list()), Array.prototype.slice.call(images.list()));
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
