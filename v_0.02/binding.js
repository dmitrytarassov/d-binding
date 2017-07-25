var reg = {
	for: new RegExp("([a-zA-Z\_]+)\ in\ ([a-zA-Z\_]+)"),
	first_prop: new RegExp("^[a-zA-Z\_]+"),
	simple_prop: new RegExp("^[a-zA-Z\_]+$")
}
/**
 * [isComponent description]
 * @param  {[type]}  element [description]
 * @return {Boolean}         [description]
 */
function isComponent(element) {

	return element.hasAttribute('d-init') || element.hasAttribute('d-component') || element.hasAttribute('d-is') || (new RegExp('COMPONENT_[A-Z]+')).test(element.tagName);

} 

function isFor(element) {

	return element.hasAttribute("d-for");

}


function Rnd (min, max){

	return Math.floor(Math.random() * (max - min + 1)) + min;

}

/**
 * absolutly stop event
 * @param {[type]} event [description]
 */
function Prevent(event) {
	if (event.stopPropagation)    event.stopPropagation();
	if (event.cancelBubble!=null) event.cancelBubble = true;
	event.preventDefault && event.preventDefault();
	event.stopPropagation && event.stopPropagation();
}

function findParentForData(element) {

	var prew = element,
		parent = element.parentNode,
		is_comp = false,
		is_for = false;


	do {

		is_comp = isComponent(parent);
		if(is_comp) {
			return false;
		}

		is_for = isFor(parent);
		if(is_for) {

			var a = 0;
			var ret = false;
			$$("*", parent).forEach(function(el) {

				if(el === prew) {
					return ret = parent.getAttribute('d-for').match(reg.for)[2]+"["+a+"]";
				}

				a++;

			});

			return {
				data:ret,
				element:parent
			};

		}

		prew = parent;
		parent = parent.parentNode;

	} while(!is_for && !is_comp);

}

function isChild (parent, child, ignore_for, debug) {

	var el = child.parentNode;
	do {
		debug && console.log(el, parent);

		if(!ignore_for && isFor(el)) {
			return false;
		}

		if(isComponent(el)) {

			debug && console.log("is_component");
			debug && console.log(el === parent);

			if(el === parent) {
				return true;
			}

			return false;
		}

		debug && console.log("is_not_component");

		el = el.parentNode;

	} while(el && el!==document);

	return false;

};

/**
 * balajs hack
 * @param  {[type]} selector [description]
 * @param  {[type]} ctx      [description]
 * @return {[type]}          [description]
 */
function $$(selector, ctx) {

	"use strict";

	return [].slice.call((ctx || document).querySelectorAll(selector));

};

var D_Directive = (function(name, code) {

	var directives = {};
	var for_storage = [];

	function D_Directive(name, code) {
		this.name = "d-"+name;
		this.code = code;
	}

	D_Directive.prototype.use = function(element, prop_name, ctx) {

		this.code(element, prop_name, ctx);

	}

	D_Directive.addToForStorage = function(element, html) {
		for_storage.push({
			element: element,
			html: html.toString()
		});
	};

	D_Directive.getForStorage = function(element) {
		for(var i in for_storage) {
			var s = for_storage[i];
			if(element.isSameNode(s.element)) {
				console.log(s.html)
				return s.html;
			};
		};

		return false;
	};

	D_Directive.getDirectives = function() {
		return directives;
	}

	D_Directive.Create = function(name, code) {
		directives[name] = new D_Directive(name, code);
	}

	return D_Directive;

}());

var D_component = (function() {

	"use strict";

	function D_component(component_name, element) {

		this.component_name = this.tag_name = component_name;
		this.$element = element;
		this.$data = {};
		this.methods = {};
		this.noreactive_data = {};
		this.$components = [];
		this.$directives = {};

	};

	D_component.prototype.setData = function(data) {
		
		var self = this;

		for(var i in data.data) {
			(function(i) {	

				self.setProp(i, data.data[i]);

			})(i);
		};

		for(var i in data.methods) {
			this.methods[i] = data.methods[i];
		}

		this.$element.innerHTML += data.template;
		this.parseHTML();

	};

	D_component.prototype.setProp = function(i, value) {

		var self = this;

		if(typeof self.$data[i]==='undefined') {
			self.noreactive_data[i] = value;

			Object.defineProperty(self.$data, i, {
				get: function() {
					return self.noreactive_data[i];
				},
				set: function(v) {
					if(self.noreactive_data[i].constructor.name === "Array") {
						self.noreactive_data[i] = [];

						for(var j in v) {

							if(typeof v[j] !== 'function') {
								self.noreactive_data[i].push(v[j]);
							}

						}
					}
					else {
						self.noreactive_data[i] = v;
					}

					if(typeof self.$directives[i]!=='undefined') {
						self.$directives[i].forEach(function(d){

							d.directive.use(d.element, i, self);

						});
					};

					if(self.noreactive_data[i].constructor.name === "Array") {

						self.initPush(i);

					};

				}
			});

			if(self.noreactive_data[i].constructor.name === "Array") {

				self.initPush(i);

			};
		}

		else {

			self.$data[i] = value;

		}
	}

	D_component.prototype.initPush = function(i) {

		var self = this;
		self.$data[i].push = function(value) {

			var data = [];
			for(var k in self.noreactive_data[i]) {
				console.log(self.noreactive_data[i][k])
				data.push(self.noreactive_data[i][k]);
			}
			data.push(value);
			self.$data[i] = data;

			self.initPush(i);
		};

	};

	D_component.prototype.parseHTML = function(ignore_for) {

		if(typeof ignore_for==='undefined') {
			ignore_for = false;
		}

		var self = this;

		var directives = D_Directive.getDirectives();
		for (var i in directives) {


			(function(d){

				var tag = "["+d.name+"]"
					, elements = $$(tag, self.$element);

				elements.forEach(function(el) {

					if(!el.hasAttribute("d-path") && isChild(self.$element, el, ignore_for)) {
						
						el.setAttribute("d-path", "true");
						var name = el.getAttribute(d.name);
						d.use(el, name, self);
						var prop = self.getConcreteProp(name);

						if(typeof self.$directives[prop]==='undefined') {
							self.$directives[prop] = [];
						}

						var obj = {
							element: el,
							directive: d
						};


						self.$directives[prop].push(obj);

					};

				});

			})(directives[i]);

		};

		D.Search.call(this);	

	};

	D_component.prototype.getConcreteProp = function(prop) {
		if(reg.for.test(prop)) {
			return prop.match(reg.for)[2];
		}
		return prop.match(reg.first_prop)[0];
	}

	D_component.prototype.getValue = function(prop_name, element) {

		var value = "";

		if(reg.simple_prop.test(prop_name)) {
			value = this.$data[prop_name];
		}
		else {
			var rnd = Rnd(1000,9999)
			, str = "return d_"+rnd+"."+prop_name;
			;

			window["d_"+rnd] = this.$data;
			value = Function(str)();
			delete window["d_"+rnd];
		}

		if(typeof value!=='undefined') {
			return value;
		};

		if(typeof element!=='undefined') {
			var data = findParentForData(element);
			console.log(data)
			if(data) {
				return this.getValue(data.data, data.element);
			}
		}

		return "";

	};

	/**
	 * [Search poisk componenta po imeni v roditele]
	 * @param {[type]} parent         [parent element]
	 * @param {[type]} component_name [name of component]
	 * @param {[type]} data           [data]
	 */
	D_component.Search = function(parent, component_name, data, parent_component) {
		var arr = [];
		$$(component_name, parent).forEach(function(element) {

			if(isChild(parent, element, false)) {
				var c = new D_component(component_name, element);
				c.$root = parent_component.$root;
				c.$parent = parent_component;
				c.setData(data);

				for (var a in element.attributes) {
					var attr = element.attributes[a];
					if((new RegExp("d-bind:[a-zA-Z\_\-]+")).test(attr.nodeName)) {
						var attr_name = attr.nodeName.substring(7, attr.nodeName.length);
						var val = parent_component.getValue(element.getAttribute(attr.nodeName));
						console.log(attr_name, val);
						c.setProp(attr_name, val);
					}
				}

				arr.push(c);
			};

		});

		return arr;

	}

	return D_component;

})();

var D = (function() {

	"use strict";
	var components_ = {};

	function D(element) {

		var self = this;
		this.$element = $$(element)[0];
		this.$element.setAttribute("d-init", "true");
		this.$root = this;
		this.$parent = this;
		this.$components = [];

		D.Search.call(this);

	};

	D.Search = function() {
		var self= this;
		// console.log(this);
		for(var i in components_) {

			(function(component_) {

				component_.forEach(function(c) {

					var cs = D_component.Search(self.$element, c.component_name, c.data, self);
					cs.forEach(function(c){
						self.$components.push(c);
					}); 

				});

			})(components_[i]);

		}
	}

	D.component = function(component_name, data) {

		if(typeof components_[component_name] === 'undefined') {
			components_[component_name] = [];
		};

		components_[component_name].push({
			component_name:component_name, 
			data:data
		});

	};

	return D;

})();

D_Directive.Create("text", function(element, prop_name, ctx) {

	var value = ctx.getValue(prop_name, element);

	element.innerHTML = value;

});

D_Directive.Create("click", function(element, prop_name, ctx) {

	element.addEventListener("click", function(e) {

		if(typeof ctx.methods[prop_name] === 'function') {
			ctx.methods[prop_name](e);
			Prevent(e);
		}

	});

});

D_Directive.Create("for", function(element, prop_name, ctx) {

	var html = D_Directive.getForStorage(element);
	if(!html) {
		console.log(html)
		var html = element.innerHTML;
		D_Directive.addToForStorage(element, html);
	};

	if(reg.simple_prop.test(prop_name)) {
		prop_name = "i in "+prop_name;
	}
	
	var props = prop_name.match(reg.for);
	var prop = props[2];
	var values = ctx.getValue(prop);
	
	while (element.firstChild) {
	    element.removeChild(element.firstChild);
	}

	for(var i in values) {
		var v = values[i];
		if(typeof v !== 'function') {
			console.log(html)
			element.innerHTML += html;
			ctx.parseHTML(true);
		}
	};

});






