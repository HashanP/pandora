var achilles = require("achilles");

var b = achilles.User.prototype.can;

achilles.User.prototype.can = function(model, operation, id, part) {
  console.log(id);
  if(part === "quizzes.attempts") {
    return true;
  } else {
    return b.apply(this, arguments);
  }
}

module.exports = achilles.User;
