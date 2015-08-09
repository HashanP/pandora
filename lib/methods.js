Meteor.methods({ 
	findSchool: function(hostname) { 
		return Schools.findOne({hostname: hostname}); 
	}, 
	createUser2: function(username, password, readSubjects, writeSubjects, userId) { 
		if(Meteor.user() && Meteor.user().roles.indexOf("admin") !== -1) { 
			if(!userId) {
				userId = Accounts.createUser({ username: username, password: password, profile: { schoolId: Meteor.user().schoolId } });
			} else {
				Meteor.users.update(userId, {$set: {username: username}});
			}
			readSubjects = _.without.apply(_, [readSubjects].concat(writeSubjects));
			Rooms.update({_id: {$in: readSubjects}}, {$push: {students: userId}}, {validate: false, multi:true});
			Rooms.update({_id: {$not: {$in: readSubjects}}}, {$pull: {students:userId}}, {validate: false, multi:true});
			Rooms.update({_id: {$in: writeSubjects}}, {$push: {teachers: userId}}, {validate: false, multi:true});
			Rooms.update({_id: {$not: {$in: writeSubjects}}}, {$pull: {teachers: userId}}, {validate: false, multi: true});
		} else { 
			throw Meteor.Error(403, "Access Denied"); 
		} 
	},
	insertPost: function(roomId, content, youtubes, images) {
		images = images.map(function(x) {
			return _.pick(x, "data", "title");
		});	
		if(Meteor.user() && (Meteor.user().roles.indexOf("admin") !== -1 || Rooms.findOne(roomId).teachers.indexOf(Meteor.userId()) !== -1)) {
			Rooms.update(roomId, {$push: {notices: {type: "post", content: content, _id: Meteor.uuid(), dateCreated: new Date(Date.now()), youtubes: youtubes, images: images}}});
		}
	},
	removePost: function(roomId, noticeId) {
		Rooms.update(roomId, {$pull: {notices: {noticeId: noticeId}}});
	},
	createFolder: function(roomId, active, pathD, folderName) {
		if(["files", "quizzes"].indexOf(active) === -1) {
			return;
		}
		var room = Rooms.findOne(roomId);
		if(!room[active]) {
			room[active] = [];
		}
		var b = room[active];
		var path = "";
		if(pathD !== "/") {
			pathD = "/" + pathD;
		} else {
			path = "/";
		}
		while(path !== pathD) {
			var n = pathD.slice(path.length + 1).split("/")[0];
			console.log(n);
			if(_.findWhere(b, {name: n})) {
				path += "/" + n;
				b = _.findWhere(b, {name: n}).files;
			} else {
				break;
			}	
		}
		if(path === pathD) {
			b.push({type: "folder", name: folderName, files: []});
			var c = {};
			c[active] = room[active];
			console.log(c);
			Rooms.update(roomId, {$set: c});
		} 
	},
	fileRename: function(roomId, active, path, old, folderName) {
		if(["files", "quizzes"].indexOf(active) === -1) {
			return;
		}
		var room = Rooms.findOne(roomId);
		var x = room[active];
		if(path !== "/") {
			path.split("/").forEach(function(p) {
				x = _.findWhere(x, {name:p}).files;
			});
		}
		_.findWhere(x, {name:old}).name = folderName;
		var c = {};
		c[active] = room[active];
		Rooms.update(roomId, {$set: c});
	},
	delFolder: function(roomId, active, path, name) {
		if(["files", "quizzes"].indexOf(active) === -1) {
			return;
		}
		var room = Rooms.findOne(roomId);
		var x = room[active];
		if(path === "/") {
			var p = _.findWhere(room[active], {name: name});
			room[active] = _.without(room[active], p);		
		} else {
			path.split("/").forEach(function(p) {
				x = _.findWhere(x, {name: p}).files;
			});
			var p = _.findWhere(x, {name: name});	
			x.splice(x.indexOf(p), 1);
		}
		superDel(p);
		var c = {};
		c[active] = room[active];
		Rooms.update(roomId, {$set: c});
	},
	drop: function(roomId, active, path, target, actives) {
		if(["files", "quizzes"].indexOf(active) === -1) {
			return;
		}
		var room = Rooms.findOne(roomId);
		var x = room[active];
		if(path !== "/") {
			path.split("/").forEach(function(p) {
				x = _.findWhere(x, {name:p}).files;
			});
		}
		actives.forEach(function(active) {
			_.findWhere(x, {name: target}).files.push(_.findWhere(x, {name: active}));
			x.splice(_.indexOf(x, _.findWhere(x, {name: active})), 1);
	  });
		var c = {};
		c[active] = room[active];
		Rooms.update(roomId, {$set: c});
	},
	createQuiz: function(roomId, path, title, questions) {
		var room = Rooms.findOne(roomId);
		var x = room.quizzes;
		if(path !== "/") {
			path.split("/").forEach(function(p) {
				x = _.findWhere(x, {name:p}).files;
			});
		}
		Quizzes.insert({questions:questions, roomId: roomId}, function(err, id) {
			if(err) {
				return console.log(err);
			} else {
				x.push({
					name: title, 
					quizId: id,
					type: "quiz"
				});
				Rooms.update(roomId, {$set: {quizzes: room.quizzes}});
			}
		});
	},
	attemptQuiz: function(quizId, questions) {
		var quiz = Quizzes.findOne(quizId);
		var c = {
			quizId: quizId,
			userId: Meteor.userId(),
			questions: [],
			score: 0,
			max: 0
		};
		quiz.questions.forEach(function(y, i) {
			if(y.type === "text") {
				y.textAnswer = questions[i].answer;
				y.correct = y.possibleTextAnswers.indexOf(y.textAnswer) !== -1;
			} else if(y.type === "number") {
				y.numberAnswer = questions[i].answer;
				y.correct = y.possibleNumberAnswers.indexOf(y.numberAnswer) !== -1;
			} else if(y.type === "list") {
				y.listAnswer = questions[i].answer;
				y.correct = _.findWhere(y.options, {active:true}).value === y.listAnswer;
			} else if(y.type === "checkboxes") {
				y.checkboxesAnswers = questions[i].answer;
				y.correct = _.difference(_.pluck(_.findWhere(y.options, {active:true}), "value"), y.checkboxesAnswers) === [];
			}
			if(y.correct) {
				c.score++;
			} 

			if(y.type ==="fill_in_the_blanks") {
					y.marks = 0;
					y.filbAnswers = questions[i].answer;
					_.each(y.text.match(/\[[a-zA-Z,\s\."'\d]+\]/g), function(a, i) {
						var g = a.substring(1, a.length-1);
						if(g === y.filbAnswers[i]) {
							y.marks++;
							c.score++;
						}	
						c.max++;
					});	
				if(y.marks === y.filbAnswers.length) {
					y.correct = true;
				}
			} else {
				c.max++;
			}
			c.questions.push(y);
		});
		return QuizResults.insert(c);
	},
	createVocabQuiz: function(roomId, path, title, questions)	{
		var room = Rooms.findOne(roomId);
		var x = room.quizzes;
		if(path !== "/") {
			path.split("/").forEach(function(p) {
				x = _.findWhere(x, {name:p}).files;
			});
		}
		VocabQuizzes.insert(_.extend({questions: questions}, {roomId: roomId}), function(err, id) {
			if(err) {
				console.log(err);
			}
			console.log('here');
			x.push({
				name: title, 
				quizId: id,
				type: "vocabQuiz"
			});
			Rooms.update(roomId, {$set: {quizzes: room.quizzes}});
		});
	}
});

var superDel = function(folder) {
	if(folder.type === "file") {
		Files.remove(folder._id);
	} else if(folder.type === "quiz") {
		Quizzes.remove(folder.quizId);
	} else if(folder.type === "vocabQuiz") {
		VocabQuizzes.remove(folder.quizId);
	} else if(folder.files) {
		folder.files.forEach(function(n) {
			superDel(n);
		});
	}
}
