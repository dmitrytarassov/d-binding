function $$(selector, ctx) {
	var els = [].slice.call((ctx || document).querySelectorAll(selector));

	for(var i in els) {
		(function(el) {
			el.parentComponents = function() {
				var parentSelector = document;

				var parents = [];
				var p = el.parentNode;

				do {
					var o = p;

			        if(p.hasAttribute('d-component') || p.hasAttribute('d-is')) {
			        	parents.push(o);
			        };

			        p = o.parentNode;
				}
				while (p !== parentSelector);

				return parents;
			};

			el.isComponent = function() {
				return el.hasAttribute('d-component') || el.hasAttribute('d-is');
			}
		})(els[i])
	};

	return els;
};

var Directive = (function(name, code) {
	function Directive(n, c) {
		this.name = n;
		this.code = c;
		this.components = {};
		this.components_values = {};
		this.components_to_eval = {};
		this.await_components = [];
	};

	Directive.prototype.init = function(ctx) {
		for(var v in this.components_values) {
			if(!this.components[v]) {
				this.components[v] = [];
			};
			this.components[v].push(this.components_values[v]);
		};
		//console.log(this.await_components)
		for(var a of this.await_components) {
			if(a.element.parentComponents()[0] === ctx.element) {
				//console.log(a.component_name, ctx.component_name, ctx)
				for(var p in ctx.props) {
					var reg = new RegExp(p+"+");
					if(reg.test(a.name)) {
						if(!this.components_to_eval[p]) {
							this.components_to_eval[p] = [];
						}

						this.components_to_eval[p].push(a);
					}
				} 	
			};
		};
		console.log("-------")
	};

	Directive.prototype.add = function(name, element, component_name) {
		if(/^[a-zA-Z\-\_]*$/.test(name)) {
			if(!this.components_values[name]) {
				this.components_values[name] = [];
			};

			this.components_values[name].push(element);
		}
		else {
			this.await_components.push({name: name, element: element, component_name: component_name});
		}
	};

	Directive.prototype.update = function(prop_name, value, ctx) {
		if(this.components[prop_name]) {
			this.components[prop_name].forEach((el) => {
				for(var element of el) {
					((element) => {
						ctx.execCode(element, ctx, () => {
						var parents = element.parentComponents();
							for(var parent of parents) {
								if(parent===ctx.element) {
									this.code(ctx, value, element);
									return;
								}
							};
						});
					})(element);
				}
			});
		};

		if(this.components_to_eval[prop_name]) {
			this.components_to_eval[prop_name].forEach((comp) => {
				var parents = comp.element.parentComponents();
				for(var p in parents) {
					if(parents[p]===ctx.element) {
						return ((p) => {
							var parent = parents[p];
							window["dprop"+p+prop_name] = ctx.props[prop_name];
							var v = eval("dprop"+p+comp.name);

							this.code(ctx, v, comp.element);
							delete window[prop_name];
							return;

						})(p);
					};
					return;
				};
			});
		};
	};

	return Directive;
})();

Component = (function (element, component_name) {
	var directives = {};

	function Component(element, component_name) {
		this.element = element;
		this.props = {};
		this.props_values = {};
		this.models = {};
		this.text_blocks = {};
		this.methods = {};
		this.childs = [];
		this.watch = {};
		this.parent = null;
		this.subscribers = {};
		this.data = {};
		this.component_name = component_name;
	}

	Component.prototype.init = function (foo) {
		this.findModels();
		this.findTextBlocks();

		foo.call(this).then((code) => {
			code();

			for(var d in directives) {
				directives[d].init(this);
			};

			for(var k in this.props) {
				this.updateProp(k, this.props[k]);
			};

			this.initClicks(this);
			this.initChilds();
			this.initProps();
		});
	}

	Component.prototype.initChilds = function() {
		var childs = $$('[d-is]', this.element);
		childs.forEach((el) => {
			this.execCode(el, this, () => {
				var component = el.getAttribute("d-is");
					
				var props = {};

				for (var attr of el.attributes) {
					if((new RegExp("d-bind:[a-zA-Z\_\-]+")).test(attr.nodeName)) {
						var attr_name = attr.nodeName.substring(7, attr.nodeName.length);
						props[attr_name] = this.props[attr.value] ? this.props[attr.value] : attr.value;
					}
				}

				var d = new D(component, props, el, this);
			});
		});
	};

	Component.prototype.initClicks = function(ctx) {
		var elements = $$('[d-click]', ctx.element);
		elements.forEach((el) => {
			// console.log(el)
			ctx.execCode(el, ctx, () => {
				var method = el.getAttribute('d-click');
				// console.log(el)
				el.addEventListener("click", () => {
					if(typeof this.methods[method] !== 'undefined') {
						this.methods[method].call(this);
					};
				});
			});
		});
	};

	Component.prototype.execCode = function(element, ctx, code) {
		// console.log(element.isComponent())
		// if(element.isComponent()) {
		// 	console.log('code')
		// 	return code();
		// }
		// else {
			var parents = element.parentComponents();
			for(var parent of parents) {
				if(parent===ctx.element) {
					code();
					return;
				}
				else {
					return;
				}
			};
		// };
	}

	Component.prototype.on = function(event_name, code) {
		if(!this.subscribers[event_name]) {
			this.subscribers[event_name] = [];
		}
		this.subscribers[event_name].push(code);
	}

	Component.prototype.emit = function (name, value) {
		if(this.subscribers[name]) {
			for(var code of this.subscribers[name]) {
				code(value);
			};
		};
	}

	Component.prototype.findTextBlocks = function() {
		var blocks = $$('[d-text]');
		blocks.forEach((el) => {
			this.execCode(el, this,  () => {
				var model_name = el.getAttribute('d-text');
				if(typeof this.text_blocks[model_name] === 'undefined') {
					this.text_blocks[model_name] = [];
				};
				this.text_blocks[model_name].push(el);
			});
		});
	};

	Component.prototype.initProps = function () {
		for (var k in this.props) {
			((k) => {
				var d = Object.getOwnPropertyDescriptor(this.props, k);
				if(d.set === undefined) {
					this.initProp(k, this.props[k], true);
				}
			})(k);
		}
	}

	Component.prototype.initProp = function (prop_name, value, override) {
		if(typeof this.props[prop_name] === 'undefined' || override) {
			if(!value) {
				this.props_values[prop_name] = null;
			}
			var self = this;
			Object.defineProperty(this.props, prop_name, {
				get:function() {
					return self.props_values[prop_name];
				},
				set: function (value) {
					self.updateProp(prop_name, value);
				},
				enumerable: true
			});

			if(value) {
				this.props[prop_name] = value;
			}
		};
	}

	Component.prototype.findModels = function() {
		var models = $$('[d-model]', this.element);
		models.forEach((el) => {
			this.execCode(el, this,  () => {
				var model_name = el.getAttribute('d-model');

				if(typeof this.models[model_name] === 'undefined') {
					this.models[model_name] = [];
				};

				this.initProp(model_name);

				this.models[model_name].push(el);

				el.addEventListener('keyup', () => {
					this.props[model_name] = el.value;
				});
			});
		});
	};

	Component.prototype.updateProp = function(name, value) {
		if(this.props_values[name]!=='value') {
			this.props_values[name] = value;
			if(typeof this.models[name] !== 'undefined') {
				this.models[name].forEach((el) => {
					el.value = value;
				});
			};
			if(typeof this.text_blocks[name] !== 'undefined') {
				this.text_blocks[name].forEach((el) => {
					el.innerHTML = value;
				});
			};

			for(var d in directives) {
				directives[d].update(name, value, this);
			};

			if(this.watch[name]) {
				this.watch[name].call(this);
			};
		}
	};

	Component.directive = function(name, foo) {
		var attr = '[d-'+name+']';
		var elements = $$(attr);

		if(name!=="is") {
			var d = new Directive(name, foo);

			elements.forEach((el) => {
				var parents = el.parentComponents();
				if(parents.length) {
					var concrete_parent = parents[parents.length - 1];
					var component_name = concrete_parent.hasAttribute("d-component") ? concrete_parent.getAttribute("d-component") : concrete_parent.getAttribute("d-is");

					var param = el.getAttribute("d-"+name);
					d.add(param, el, component_name);
				}
			});

			directives[name] = d;
		};
	};

	return Component;
})();

Component.directive("show", function(context, value, el) {
	var set_value = (value) ? 'block' : 'none';
	el.style.display = set_value;
});

Component.directive("class", function(ctx, value, el) {
	//console.log(value, el)
	el.className = value;
});

Component.directive("src", function(ctx, value, el) {
	el.src = value;
});

Component.directive("is", function(ctx, value, el) {
	var name = el.getAttribute("is");
	//console.log(name)
});

var D = (function (component_name, foo, concrete_element, parent) {
	var components = {};
	function D(component_name, foo, concrete_element, parent) {
		if(!components[component_name] && typeof foo === "function") {
			components[component_name] = foo;
		};
		var elems;

		if(!concrete_element) {
			elems = $$('[d-component="'+component_name+'"]');
		}
		else {
			elems = [concrete_element];
		}

		elems.forEach(function(element) {

			if(!element.hasAttribute("d-init")) {
				var component = new Component(element, component_name);


				component.init(components[component_name]);

				if(foo && typeof foo === "object") {
					for(var k in foo) {
						component.props[k] = foo[k];
					}
				};

				if(parent) {
					component.parent = parent;
					if(parent.root) {
						component.root = parent.root;
					}
					else {
						component.root = parent;
					}
				}

				element.setAttribute("d-init","true");
			};
		});

	};

	return D;
})();






