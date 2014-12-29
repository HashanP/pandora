Courses = new Mongo.Collection("courses");

UI.registerHelper('eq', function(v1, v2, options) {
  if(v1 == v2){
    return true
  } else {
    return false
  }
});

UI.registerHelper("i", function(obj) {
  if(!obj) return null;
  obj.forEach(function(item, i) {
    item.index = i;
  });
  return obj;
});

var Schemas = {};

Schemas.Post = new SimpleSchema({
  "title": {
    type: String
  },
  "content": {
    type: String
  },
  "type": {
    type: String
  }
});

Schemas.Course = new SimpleSchema({
  "title": {
    type: String,
    label: "Title",
    max: 10
  },
  "icon": {
    type: String,
    label: "Icon",
    allowedValues:["French", "Latin", "Computing", "Art", "English", "Mathematics"]
  },
  "posts": {
    type: [Schemas.Post]
  }
});

Courses.attachSchema(Schemas.Course);

if (Meteor.isClient) {
  Template.login.events({
    "submit .login-form": function(e) {
      var username = e.target.username.value;
      var password = e.target.password.value;

      Meteor.loginWithPassword(username, password, function(err){
        if(err) {
          Session.set("err", "Your username or password is incorrect.");
        } else {
          Session.set("err", "");
        }
      });

      return false;
    }
  });

  Template.subjects.helpers({
    "courses": function() {
      return Courses.find({}, {sort:{icon:1}});
    }
  });

  Template.navbar.helpers({
    "username":function() {
      if(Meteor.user()) {
        return Meteor.user().emails[0].address.split("@")[0];
      }
    },
    "admin": function() {
      if(Meteor.user()) {
        return Meteor.user().roles.indexOf("admin") !== -1;
      }
    }
  });

  Template.insertPost.helpers({
    "schema": function() {
      return Schemas.Post;
    },
    "type": function() {
      return Session.get("type");
    }
  });

  Template.insertPost.events({
    "change #options": function(e) {
      Session.set("type", e.target.value);
    },
    "submit form": function(e) {
      console.log(this._id);
      Courses.update(this._id, {
          $push:
            {
              posts: {
                title: e.target.title.value,
                type: e.target.type.value,
                content: (e.target.type.value === "rich" ? $("#editor").val() : e.target.content.value)
              }
            }
          }
        );
      return false;
    }
  });

  Template.insertPost.rendered = function() {
    $("#editor").wysihtml5();
  }

  Router.onBeforeAction(function() {
    if (!Meteor.userId()) {
      this.render('login');
    } else {

      this.next();
    }
  });

  Router.onBeforeAction(function() {
    this.layout("course", {
      data: function() {
        return Courses.findOne(this.params.id);
      }
    });
    this.next();
  }, {except:"subjects"});

  Router.route('/', {name: "subjects"});

  Router.route('/courses/:id/blog', function() {
    this.render("blog_list", {
      data: function() {
        return Courses.findOne(this.params.id);
      }
    });
  });

  Router.route('/courses/:id/blog/new', function() {
    console.log("hero");
    Session.set("type", "rich");
    this.render("insertPost", {data: Courses.findOne(this.params.id)});
  });

  Router.route("/logout", function() {
    Meteor.logout();
    this.redirect("/");
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  Accounts.config({restrictCreationByEmailDomain:'whsb.essex.sch.uk'});
}


this.AdminConfig = {
  name:"Pandora",
  adminEmails:["10punchihewah@whsb.essex.sch.uk"],
  collections: {
    Users: {
    },
    Courses: {
    }
  }
};
