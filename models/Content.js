var util = require("util");
var achilles = require("achilles");
var truncate = require('html-truncate');

function Content() {
	achilles.Model.call(this);

	this.define("type", String); // "rich", "latex"
	this.define("data", String);
	
	this.type = "rich-text-editor";

	Object.defineProperty(this, "html", {
		get: function() {
			console.log("fsdfds");
			if(this.type === "rich-text-editor") {
				return this.data;
			} else {
				return '<script type="math/tex">' + this.data + '</script>';
			}
		}
	});

	Object.defineProperty(this, "preview", {
		get: function() {
			console.log("fsdfds");
			if(this.type === "rich-text-editor") {
				return truncate(this.data, 100);
			} else {
				return truncate('<script type="math/tex">' + this.data + '</script>', 100);
			}
		}
	});
}

util.inherits(Content, achilles.Model);

module.exports = Content;
