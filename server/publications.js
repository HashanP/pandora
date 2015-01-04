Meteor.publish("userData", function () {
  return Meteor.users.find({},  {fields: {'emails': 1}});
});

Meteor.publish("courses", function() {
  var user = Meteor.users.findOne(this.userId);
  if(user) {
    if(user.roles && user.roles.indexOf("admin") !== -1) {
      return Courses.find({});
    } else {
      return Courses.find({$or:[{students:{$in:[this.userId]}}, {teachers: {$in:[this.userId]}}, {club:true}]});
    }
  }
});

Meteor.publish("files", function() {
  return Files.find({});
});

RssFeed.publish('course', function(query) {
  var self = this;

  if(!query.id) {
    throw new Error();
  }

  var course = Courses.findOne(query.id);

  self.setValue('title', self.cdata(course.title));
  self.setValue('description', self.cdata('This is a live feed of the blog of ' + course.title));
  self.setValue('link', Meteor.absoluteUrl("courses/" + course._id + "/blog"));
  self.setValue('lastBuildDate', new Date());
  self.setValue('pubDate', new Date());
  self.setValue('ttl', 1);
  // managingEditor, webMaster, language, docs, generator

  _.sortBy(course.posts, "date").reverse().forEach(function(doc) {
    self.addItem({
      title: doc.title,
      description: (doc.content.length > 150 ? doc.content.substring(0, 300) + "..." : doc.content),
      link: Meteor.absoluteUrl("courses/" + course._id + "/blog/" + doc.postId),
      pubDate: doc.date,
      guid:doc.postId
    });
  });
});

var isAllowed = function(userId, doc) {
  if(doc.category === "studentResource") {
    var user = Meteor.users.findOne(userId);
    if(user.roles && user.roles.indexOf("admin") !== -1) {
      return true;
    }
    var course = Courses.findOne(doc.owner);
    return course && course.teachers && course.teachers.indexOf(userId) !== -1;
  } else if(doc.category === "handIn") {
    var course = Courses.findOne(doc.owner);
    return userId && userId === doc.user && course && _.findWhere(course.handInFolders, {_id:doc.handInFolder});
  }
}

var isAllowedDownload = function(userId, doc) {
  if(doc.category === "studentResource") {
    return userId !== undefined;
  } else if(doc.category === "handIn") {
    if(doc.user == userId) {
      return true;
    }
    var user = Meteor.users.findOne(userId);
    if(user && user.roles && user.roles.indexOf("admin") !== -1) {
      return true;
    }
    var course = Courses.findOne(doc.owner);
    return course.teachers && course.teachers.indexOf(userId) !== -1;
  }
}

Files.allow({
  insert: isAllowed,
  update: isAllowed,
  remove: isAllowed,
  download: isAllowedDownload
});

Files.on("stored", Meteor.bindEnvironment(function(doc) {
  if(doc.category === "studentResource") {
    Courses.update(doc.owner, {$push: {studentResources: doc._id}});
  } else if(doc.category === "handIn") {
    console.log(doc.user);
    Courses.update({_id:doc.owner, "handInFolders._id": doc.handInFolder}, {$push: {"handInFolders.$.handIns":{
      fileId:doc._id,
      userId: doc.user
    }}});
  }
}));

Files.on("removed", function(doc) {
  if(doc.category === "studentResource") {
    Courses.update(doc.owner, {$pull: {studentResources: doc._id}});
  } else if(doc.category === "handIn") {
    Courses.update({_id:doc.owner, "handInFolders._id":doc.handInFolder}, {$pull: {"handInFolders.$.handIns": {fileId:doc._id}}});
  }
});

Accounts.config({restrictCreationByEmailDomain:'whsb.essex.sch.uk'});
