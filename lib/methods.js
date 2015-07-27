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
	createFolder: function(roomId, pathD, folderName) {
		var room = Rooms.findOne(roomId);
		if(!room.files) {
			room.files = [];
		}
		var b = room.files;
		var path = "";
		if(pathD !== "/") {
			pathD = "/" + pathD;
		} else {
			path = "/";
		}
		console.log(path);
		console.log(pathD);
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
			Rooms.update(roomId, {$set: {files: room.files}});
		} 
	},
	fileRename: function(fileId, value) {
		Files.update({_id: fileId}, {$set: {"original.name": value}});
	},
	folderRename: function(roomId, path, old, folderName) {
		var room = Rooms.findOne(roomId);
		var x = room;
		if(path !== "/") {
			path.split("/").forEach(function(p) {
				x = _.findWhere(room.files, {name:p});
			});
		}
		_.findWhere(room.files, {name:old}).name = folderName;
		Rooms.update(roomId, {$set: {files: room.files}});
	},
	delFolder: function(roomId, path, name) {
		var room = Rooms.findOne(roomId);
		if(path === "/") {
			var p = _.findWhere(room.files, {name: name});
			room.files = _.without(room.files, p);		
		} else {
			path.split("/").forEach(function(p) {
				room = _.findWhere(room.files, {name: p});
			});
			var p = _.findWhere(room.files, {name:name});
			room.files = _.without(room.files, p);
		}
		superDel(p);
		Rooms.update(roomId, {$set: {files: room.files}});
	},
	drop: function(roomId, path, target, actives) {
		console.log(roomId);
		console.log(path);
		console.log(target);
		console.log(actives);
		var room = Rooms.findOne(roomId);
		var x = room;
		if(path !== "/") {
			path.split("/").forEach(function(p) {
				x = _.findWhere(x.files, {name:p});
			});
		}
		actives.forEach(function(active) {
			_.findWhere(x.files, {name: target}).files.push(_.findWhere(x.files, {name: active}));
			x.files.splice(_.indexOf(x.files, _.findWhere(x.files, {name: active})), 1);
	  });
		Rooms.update(roomId, {$set: {files: room.files}});
	}
});

var superDel = function(folder) {
	if(!folder.files) {
		return;
	}
	folder.files.forEach(function(n) {
		if(n.type === "file") {
			Files.remove(n._id);
		} else {
			superDel(n);
		}
	});
}
