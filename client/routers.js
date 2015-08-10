Router.onBeforeAction(function() {
	if(!school.get()) {
		if(window.location.hostname.split(".").length === 2 || window.location.hostname.split(".").length === 3) {
			Meteor.call("findSchool", window.location.hostname.split(".")[0], function(err, data) {
				school.set(data);
			});
		}
	} else {
		if(!Meteor.userId()) {
			this.render("login");
		} else {
			this.layout("base");
			this.next();
		}
	}
});

Router.onAfterAction(function() {
	window.setTimeout(function() { 
		console.log(window.location);
		wnd.set(window.location);	
	}, 0);
});

Router.route("/", function() {
	this.render("room");
});

Router.route("/subjects", function() {
	console.log("here");
	this.render("/subjects");
});

Router.route("/rooms/:room", function() {
	Session.set("navActive", "notices");
	var room = Rooms.findOne(this.params.room);
	room.notices = _.sortBy(room.notices, function(notice) {return notice.dateCreated;}).reverse();
	Session.set("isNotEmpty", false);
	Session.set("post", "");
	this.render("notices", {data: room});
});

Router.route("/rooms/:room/notices/announcement", function() {
	window.images = new ReactiveArray();	
	window.youtubes = new ReactiveArray();
	var room = Rooms.findOne(this.params.room);
	this.render("/announcement", {data: room});
});

Router.route("/rooms/:room/notices/create/poll", function() {
	this.render("/notices/create/poll", {data: Rooms.findOne(this.params.room)});
});

Router.route("/rooms/:room/files/:path*", function() {
	Session.set("navActive", "files");
	Session.set("path", this.params.path ? this.params.path : "/");
	Session.set("filesBeingUploaded", []);
	Session.set("newFolder", false);
	Session.set("noOfActive", 0);
	var room = Rooms.findOne(this.params.room);
	if(!this.params.path) {
		var files = room.files;
	} else {
		var files = room.files;
		var pathSplit = this.params.path.split("/");
		pathSplit.forEach(function(p) {
			files = _.findWhere(files, {name: p}).files;
		});
	}
	Session.set("search", this.params.query.search);
	this.render("files", {data:{_id: room._id, files: files}});
});

Router.route("/rooms/:room/quizzes/:path*", function() {
	Session.set("navActive", "quizzes");
	Session.set("path", this.params.path ? this.params.path : "/");
	var room = Rooms.findOne(this.params.room);
	var x, c, attemptId;
	if(!this.params.path) {
		var files = room.quizzes;
	} else {
		var pathSplit = this.params.path.split("/");
		x = _.findWhere(room.quizzes, {name:pathSplit[0]});
		pathSplit.slice(1).forEach(function(p) {
			if(x.type === "quiz" && p === "attempt") {
				c = 1;
			} else if(c === 2) {
				attemptId = p;
			} else if(x.type === "quiz" && p ==="attempts") {
				c = 2;
			}  else if(x.type === "quiz" && p === "results") {
				c = 3;
			} else if(x.type === "quiz" && p ==="edit") {
				c = 4;
			} else if(x.type === "vocabQuiz" && p === "edit") {
				c = 5;
			} else {
				files = _.findWhere(x.files, {name: p});
			}
		});
	}
	if(this.params.query.create === "quiz") {
		window.questions = new ReactiveArray();
		this.render("create_quiz", {data: {files: files, _id: room._id}});	
	} else if(this.params.query.create === "vocab_quiz") {
		window.questions = new ReactiveArray();
		this.render("createVocabQuiz", {data: {files: files, _id: room._id}});
	} else if(x && x.type === "quiz") {
		if(c === 1) {
			Session.set("path", this.params.path.split("/").slice(0, this.params.path.split("/").length-1).join("/"));
			this.render("quiz", {data: {_id: room._id, name: x.name, quizId: x.quizId}});
		} else if(c === 2) {
			this.render("quizResult", {data: {_id: room._id, quizId: x.quizId, name: x.name, attemptId: attemptId}});
		} else if(c ===3) {			
			Session.set("path", this.params.path.split("/").slice(0, this.params.path.split("/").length-1).join("/"));
			Session.set("criterion", "best");
			this.render("quizBarGraph", {data: {_id: room._id, quizId: x.quizId, name: x.name}});	
		} else if(c === 4) {	
			Session.set("path", this.params.path.split("/").slice(0, this.params.path.split("/").length-1).join("/"));
			window.questions = new ReactiveArray();
			this.render("create_quiz", {data: {files: files, _id: room._id, quizId: x.quizId}});
		} else { 
			this.render("quizIntro", {data: {_id: room._id, name: x.name, path: pathSplit.join("/"), quizId: x.quizId}});
		}
	} else if(x && x.type === "vocabQuiz") {
		if(c === 5) {
			Session.set("path", this.params.path.split("/").slice(0, this.params.path.split("/").length-1).join("/"));
			this.render("createVocabQuiz", {data: {files: files, _id: room._id, quizId: x.quizId}});	
		} else {
			this.render("vocabQuiz", {data: {_id: room._id, quizId: x.quizId, title: x.name}});
		}
	} else {
		Session.set("search", this.params.query.search);
		Session.set("newFolder", false);
		Session.set("noOfActive", 0);
		this.render("quizzes", {data:{_id: room._id, files: files}});
	}
});

Router.route("/admin/users", function() {
	var offset = (this.params.query.page ? parseInt(this.params.query.page, 10)  - 1 : 0) * 10;
	Session.set("limit", 10);
	Session.set("offset", offset);
	Session.set("count", Counts.get("users"));
	Session.set("page", this.params.query.page ? parseInt(this.params.query.page) : 1);
	Session.set("search", this.params.query.search ? this.params.query.search : "");
	this.render("/admin/users");
});

Router.route("/admin/users/create", function() {
	Session.set("howToChoosePassword", "username");
	this.render("/admin/users/create");
});

Router.route("/admin/users/:user/edit", function() {
	Meteor.call("findUser", this.params.user, function(err, user) {
		Meteor.call("findRoomsByUser", this.params.user, function(err, data) {
			this.render("/admin/users/create", {data: _.extend(user, {students: data[0], teachers: data[1]})});
		}.bind(this));
	}.bind(this));
});

Router.route("/admin/rooms", function() {
	Session.set("limit", 10);
	Session.set("count", Counts.get("rooms"));
	Session.set("offset", (this.params.query.page ? parseInt(this.params.query.page, 10)  - 1 : 0) * 10);
	Session.set("page", this.params.query.page ? parseInt(this.params.query.page) : 1);
	Session.set("search", this.params.query.search ? this.params.query.search : "");
	this.render("/admin/rooms");
});

Router.route("/admin/rooms/create", function() {
	this.render("/admin/rooms/create");
});

Router.route("/admin/rooms/:room/edit", function() {
	Meteor.call("findRoom", this.params.room, function(err, data) {
		this.render("/admin/rooms/create", {data: data});
	}.bind(this));
});	
