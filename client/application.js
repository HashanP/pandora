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
}.bind(this));
