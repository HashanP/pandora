Meteor.subscribe("userData");
Meteor.subscribe("courses");
Meteor.subscribe("files");

this.lastActive;

Meteor.startup(function() {
  MathJax.Hub.Config({
    tex2jax: {
      displayMath: [],
      inlineMath: []
    },
    showMathMenu:false,
    "HTML-CSS": { linebreaks: { automatic: true } },
    SVG: { linebreaks: { automatic: true } }
  });
  $("body").on("blur", "input", function(e) {
    this.lastActive = e.target;
  }.bind(this));

  $("body").on("click", ".admin .toggle", function(e) {
    $(".sidebar").toggleClass("sidebar-open");
  });

  $("body").on("click", ".admin .sidebar a[href]", function(e) {
    $(".sidebar").removeClass("sidebar-open");
  });

  Meteor.autorun(function(){
    if(Meteor.userId()){
      $("body").addClass("loggedIn");
    } else {
      $("body").removeClass("loggedIn");
    }
  });
}.bind(this));
