var achilles = require("achilles");
var util = require("util");

function Option() {
  achilles.Model.call(this);
  this.define("title", String);
  this.define("correct", Boolean);
}

util.inherits(Option, achilles.Model);

module.exports = Option;
