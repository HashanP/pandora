Meteor.subscribe("userData");
Meteor.subscribe("courses");
Meteor.subscribe("files");

var lastActive;

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
    lastActive = e.target;
  });
});
