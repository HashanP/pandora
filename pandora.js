Courses = new Mongo.Collection("courses");

var Schemas = {};

Schemas.Course = new SimpleSchema({
  title: {
    type: String,
    label: "Title",
    max: 10
  },
  icon: {
    type: String,
    label: "Icon",
    allowedValues:["French", "Latin", "Computing", "Art", "English", "Mathematics"]
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
      console.log(Meteor.user());
      return Meteor.user().emails[0].address.split("@")[0];
    },
    "admin": function() {
      return Meteor.user().roles.indexOf("admin") !== -1;
    }
  });

  Router.onBeforeAction(function() {
    if (! Meteor.userId()) {
      this.render('login');
    } else {
      if(this.route._path.slice(0, 6) !== "/admin") {
        this.layout("main");
      }
      this.next();
    }
  });

  Router.route('/', function() {
    this.render('subjects');
  });

  Router.route('/courses/:id/blog', function() {
    console.log(this.params.id);
    this.render("blog_list", {data: function() {
      return Courses.findOne(this.params.id);
    }});
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
