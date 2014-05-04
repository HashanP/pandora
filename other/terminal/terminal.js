var uniqueIntersection = function(original, nova) {
    nova.forEach(function(val) {
	if(original.indexOf(val) === -1) original.push(val);
    });
    return original;
};

var getDifference = function(original, nova) {
    var buf = [];
    nova.forEach(function(val) {
	if(original.indexOf(val) === -1) buf.push(val);
    });
    return original;
};


// Composition over Traits & Multiple Inheritance

var TerminalOutput = stream.Writable.extend({
    constructor: function(outputFor) {
	this.__super__({objectMode:true});
	this.el = document.querySelector('output[for~="' + outputFor + '"]');
	console.log(outputFor);
    },
    _write: function(data, encoding, done) {
	ES.append(this.el, data);
	done();
    },
    clear: function() {
	ES.clear(this.el);
    }
});

var Terminal = ES.Controller.extend({

    constructor: function(el) {

	this.inputEl = el.querySelector("input");
	this.inputEl.className = "cmdline";
	this.inputEl.id = "command";

	this.inputLine = document.createElement("div");
	this.inputLine.id = "input-line";
	this.inputLine.className = "input-line";

	this.promptEl = document.createElement("div");
	this.promptEl.className = "prompt";
	this.promptEl.innerHTML = this.prompt || "$&gt;";

	this.out = new TerminalOutput(el.id);

	ES.wrap(this.inputLine, this.inputEl);
	ES.prepend(this.inputLine, this.promptEl);

	this.__super__(el);

	this.interlace = document.createElement("div");
	this.interlace.classList.add("interlace");

	ES.insertBefore(this.el, this.interlace);

	this.history = [];
    },

    events: {
	"output DOMSubtreeModified": "recalculateHeight",
	"input keydown": "processNewCommand"
    },

    recalculateHeight: function(e) {
	var docHeight = ES.getDocHeight();
	document.documentElement.style.height = docHeight + 'px';
	this.interlace.style.height = docHeight + 'px';
	var inputLine = this.inputLine;
	setTimeout(function() { // Need this wrapped in a setTimeout. Chrome is jupming to top :(
	    ES.scrollTo(inputLine);
	}, 0);
    },

    screenFlicker: function(e) {
	// Toggle CRT screen flicker.
	if ((e.ctrlKey || e.metaKey) && e.keyCode == 83) { // crtl+s
	    container_.classList.toggle('flicker');
	    this.output('<div>Screen flicker: ' +(container_.classList.contains('flicker') ? 'on' : 'off') + '</div>');
	    e.preventDefault();
	    e.stopPropagation();
	}
    },

    processNewCommand: function(e) {
	if(e.keyCode === 13) {
	    var value = this.inputEl.value;
	    var dummy = ES.clone(this.inputLine);
	    this.inputEl.readonly = true;
	    var input = dummy.querySelector("input");

	    this.out.write(dummy);
	    this.inputEl.readonly = false;
	    this.inputEl.value = "";
	}
	this.screenFlicker(e);
    },

    clear: function() {
	this.out.clear();

	document.documentElement.style.height = '100%';
	this.interlace.style.height = '100%';
    },

    write: function(html) {
	ES.append(this.outputEl, html);
	ES.scrollTo(this.inputLine);
    }

});

var controllers = {};

var register = function(selector, controller) {
    controllers[selector] = controller;
};

var onload = function(el) {
    if(el === undefined || el instanceof Event) el = document;
    for(var controller in controllers) {
	var els = el.querySelectorAll(controller);
	for(var i = 0; i < els.length; i++) {
	    new controllers[controller](els[i]);
	}
    }
};

export { Terminal };
