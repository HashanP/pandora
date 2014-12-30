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

UI.registerHelper("truncate", function(text, max) {
  text = $("<p>" + text + "</p>").text();
  if(text.length > max) {
    return text.substring(0, max) + "...";
  }
  return text;
});

UI.registerHelper("sortBy", _.sortBy);

UI.registerHelper("titleCase", function(str) {
  var result = str.replace(/([A-Z]+)/g, " $1").replace(/([A-Z][a-z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
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
    autoValue:function() {
      if(this.operator !== "$pull") {
        return Meteor.uuid();
      }
    }
  }
});

Schemas.VocabularyQuestion = new SimpleSchema({
  "question": {
    type:String
  },
  "answer": {
    type: String
  }
});

Schemas.VocabularyQuiz = new SimpleSchema({
  "title": {
    type: String
  },
  "questions":{
    type:[Schemas.VocabularyQuestion]
  },
  "_id": {
    type: String,
    autoValue:function() {
      if(this.operator !== "$pull") {
        return Meteor.uuid();
      }
    }
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
    type: [Schemas.Post],
    optional: true
  },
  "vocabularyQuizzes": {
    type: [Schemas.VocabularyQuiz],
    optional: true
  }
});

Courses.attachSchema(Schemas.Course);

if (Meteor.isClient) {
  var lastActive;

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
    $("body").on("blur", "input", function(e) {
      console.log("fsddfs");
      lastActive = e.target;
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
      return this.post.content.split("?v=")[1];
    }
  });

  Template.post.events({
    "click .del": function() {
      Courses.update(this.doc._id, {$pull:{posts:{postId:this.post.postId}}});
      Router.go("/courses/" + this.doc._id +"/blog");
      //return false;
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
      Meteor.call("post", this._id || this.doc._id, {
        title: e.target.title.value,
        type: e.target.type.value,
        content: (e.target.type.value === "rich" ? $("#editor").val() : e.target.content.value)
      }, (this.post ? this.post.postId : undefined))
      Router.go("/courses/" + (this._id || this.doc._id)+ "/blog" + (this.post ? "/" + this.doc.posts.indexOf(this.post) : ""));
      return false;
    },
    "DOMNodeInserted": function(e) {
        if(e.target.classList.contains("form-group")) {
          $("#editor").wysihtml5();
        }
    }
  });

  Template.vocabularyQuestion.events({
    "click .del": function() {
      Blaze.remove(Blaze.currentView);
    }
  });

  Template.insertVocabularyQuiz.events({
    "click .addQuestion": function(e) {
      Blaze.render(Template.vocabularyQuestion, e.target.parentNode.parentNode.parentNode, e.target.parentNode.parentNode);
    },
    "submit form": function(e) {
      var data = {title:e.target.title.value, questions:[]};
      var el = $(e.target);
      el.find(".questions").each(function(i, el) {
        data.questions.push({
          question:$(el).find(".part-q").val(),
          answer:$(el).find(".part-a").val()
        })
      });
      Courses.update(this.doc._id, {$push:{vocabularyQuizzes:data}});
    }
  });

  Template.accents.events({
    "click .accent":function(e) {
        var focus = $(lastActive);
        var start = lastActive.selectionStart, end = lastActive.selectionEnd;
        focus.val(focus.val().substring(0, start) + $(e.target).text() + focus.val().slice(end));
        lastActive.focus();
        lastActive.setSelectionRange(start+1, start + 2);
    }
  });

  Template.vocabularyQuiz.events({
    "change input": function(e) {
      if(e.target.dataset.answer.toLowerCase().split(",").map(function(str) {return str.trim()}).indexOf(e.target.value.toLowerCase().trim()) !== -1) {
        if(!e.target.classList.contains("correct")) {
          e.target.classList.add("correct");
          e.target.classList.remove("incorrect");
          if(e.target.nextSibling && e.target.nextSibling.nextSibling) {
            e.target.nextElementSibling.nextElementSibling.focus();
          } else {
            e.target.blur();
          }
        }
      } else if(e.target.value !== "") {
        e.target.classList.add("incorrect");
        e.target.classList.remove("correct");
      }
    },
    "click .revealAnswers": function() {
      Template.instance().findAll("input").forEach(function(el) {
        if(!el.classList.contains("correct")) {
          el.classList.add("incorrect");
        }
        el.value = el.dataset.answer;
        el.readOnly = true;
      });
    },
    "click .reset": function() {
      Template.instance().findAll("input").forEach(function(el) {
        el.value = "";
        el.classList.remove("correct");
        el.classList.remove("incorrect");
        el.readOnly = false;
      });
    },
    "click .del": function() {
      Courses.update(this._id, {$pull: {vocabularyQuizzes:{_id:this.quiz._id}}});
      Router.go("/courses/" + this._id + "/vocabularyQuizzes")
    }
  });

  Template.insertVocabularyQuiz.rendered = function() {
    var sort = new Sortable(this.find(".questions"), {
      animation: 150, // ms, animation speed moving items when sorting, `0` — without animation
      handle: ".handle", // Restricts sort start click/touch to the specified element
      draggable: ".question",
      ghostClass:"ghost"
    });
  }

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
    if(this.route._path.slice(0, 6) !== "/admin") {
      this.layout("course", {
        data: function() {
          return {doc:Courses.findOne(this.params.id), section:this.route._path.split("/")[3]};
        }
      });
    }
    this.next();
  }, {except:["subjects"]});

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
    var data = Courses.findOne(this.params.id);
    this.render("post", {data: {doc: data, post: data.posts[this.params.post], index:this.params.post}});
  });

  Router.route('/courses/:id/blog/:post/edit', function() {
    var data = Courses.findOne(this.params.id);
    Session.set("type", data.posts[this.params.post].type);
    this.render("insertPost", {data: {doc: data, post: data.posts[this.params.post]}});
  });

  Router.route('/courses/:id/vocabularyQuizzes', function() {
    this.render("vocabularyQuizzes", { data: function() { return Courses.findOne(this.params.id);}});
  });

  Router.route('/courses/:id/vocabularyQuizzes/new', function() {
    this.render("insertVocabularyQuiz", {data: function(){ return {doc:Courses.findOne(this.params.id)}; }});
  });

  Router.route("/courses/:id/vocabularyQuizzes/:vocabularyQuiz", function() {
    this.render("vocabularyQuiz", {data: function() {
      var data = Courses.findOne(this.params.id);
      if(data) {
        return {quiz:_.findWhere(data.vocabularyQuizzes, {_id:this.params.vocabularyQuiz}), _id:data._id};
      }
    }});
  });

/*  Router.route('/courses/:id/blog/:post/delete', function() {
    Courses.update(this.doc._id, {$pull: {posts:{postId:this.post.postId}}});
    this.redirect("/courses/" + this.params.id + "/blog");
  });*/

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

Meteor.methods({
  "post": function(courseId, post, postId) {
    if(postId) {
      Courses.update({_id:courseId,"posts.postId":postId}, {$set:{"posts.$": post}});
    } else {
      Courses.update(courseId, {$push:{posts:post}});
    }
  }
});

this.AdminConfig = {
  name:"Pandora",
  adminEmails:["10punchihewah@whsb.essex.sch.uk"],
  collections: {
    Users: {
    },
    Courses: {
        omitFields:["posts"]
      }
  }
};
