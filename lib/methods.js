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
	insertPost: function(roomId, title, content) {
		if(Meteor.user() && (Meteor.user().roles.indexOf("admin") !== -1 || Rooms.findOne(roomId).teachers.indexOf(Meteor.userId()) !== -1)) {
			Rooms.update(roomId, {$push: {notices: {type: "post", title: title, content: content, _id: Meteor.uuid(), dateCreated: new Date(Date.now())}}});
		}
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
	}
});
