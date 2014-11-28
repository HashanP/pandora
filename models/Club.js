var Course = require("./Course").Course;
var util = require("util");

function Club() {
	Course.call(this);
}

util.inherits(Club, Course);

module.exports = Club;
