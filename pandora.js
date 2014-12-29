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
  },
  "postId": {
    type: String,
    autoValue: Meteor.uuid
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
  Meteor.startup(function() {
    MathJax.Hub.Config({
    /*  tex2jax: {
        displayMath: [],
        inlineMath: []
      },*/
      /**
      * Disables MathJax's ugly context menu.
      */
      showMathMenu:false,
      "HTML-CSS": { linebreaks: { automatic: true } },
      SVG: { linebreaks: { automatic: true } }
    });
  });


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

  Template.post.helpers({
    "id": function() {
      return this.content.split("?v=")[1];
    }
  });

  Template.post.events({
    "click .del": function() {
      Courses.update(this._id, {$pull: {posts: {postId: this.postId}}});
      Router.go("/courses/" + this._id +"/blog");
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
      console.log(e.target.type.value);
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
    },
    "DOMNodeInserted": function(e) {
        if(e.target.classList.contains("form-group")) {
          $("#editor").wysihtml5();
        }
    }
  });

  Template.insertPost.rendered = function() {
    $("#editor").wysihtml5();
  }

  Template.post.rendered = function() {
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.find(".mathjax")]);
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
  }, {except:["subjects", "admin"]});

  Router.route('/', {name: "subjects"});

  Router.route('/courses/:id/blog', function() {
    this.render("blog_list", {
      data: function() {
        return Courses.findOne(this.params.id);
      }
    });
  });

  Router.route('/courses/:id/blog/new', function() {
    Session.set("type", "rich");
    this.render("insertPost", {data: Courses.findOne(this.params.id)});
  });

  Router.route('/courses/:id/blog/:post', function() {
    this.render("post", {data: Courses.findOne(this.params.id).posts[this.params.post]});
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
