var reg = {
	// поиск for директивы
	for: new RegExp("([a-zA-Z\_]+)\ in\ ([a-zA-Z\_]+)"),
	//
	for_KEY_VALUE_test: new RegExp("[\(]{1}[a-zA-Z\_]+\,[\ ]?[a-zA-Z\_]+\[\)]{1} in\ [a-zA-Z\_]+"),
	//
	for_KEY_VALUE_match: new RegExp("[\(]{1}([a-zA-Z\_]+)\,[\ ]?([a-zA-Z\_]+)\[\)]{1} in\ ([a-zA-Z\_]+)"),
	// получение первого значения, до "[" или "."
	first_prop: new RegExp("^[a-zA-Z\_]+"),
	// является ли значение целым без "[" или "."
	simple_prop: new RegExp("^[a-zA-Z\_]+$"),
	//
	class_VALUE_IF_PROP_test: new RegExp("^[a-zA-Z\_\-]+\ if\ [a-zA-Z\_\.]+$"),
	//
	class_VALUE_IF_PROP_match: new RegExp("^([a-zA-Z\_\-]+) if ([a-zA-Z\_\.]+)"),
	//
	function_NAME: new RegExp("^[a-zA-Z\_]+$"),
	//
	function_NAME_ARGS_test:new RegExp("^[a-zA-Z\_]+[\(]{1}[a-zA-Z\.\,\_\ ]*[\)]{1}"),
	//
	function_NAME_ARGS_match:new RegExp("^([a-zA-Z\_]+)[\(]{1}([a-zA-Z\.\,\_\ ]*)[\)]{1}"),
}
/**
 * [isComponent ялляется ли элемент комонентом]
 * @param  {[Node]}  element [элемент]
 * @return {Boolean}         [description]
 */
function isComponent(element) {

	return element.hasAttribute('d-init') || element.hasAttribute('d-component') || element.hasAttribute('d-is') || (new RegExp('COMPONENT_[A-Z]+')).test(element.tagName);

} 

/**
 * [isFor является ли элемент директивой for]
 * @param  {[Node]}  element [элемент]
 * @return {Boolean}         [description]
 */
function isFor(element) {

	return element.hasAttribute("d-for");

}

/**
 * [Rnd случайное между 2мя числами]
 * @param {[Int]} min [минимальное]
 * @param {[Int]} max [максимальное]
 * @return {Boolean}         [description]
 */
function Rnd (min, max){

	return Math.floor(Math.random() * (max - min + 1)) + min;

}

/**
 * [Prevent полная остановка события]
 * @param {[Event]} event [событие]
 */
function Prevent(event) {
	if (event.stopPropagation)    event.stopPropagation();
	if (event.cancelBubble!=null) event.cancelBubble = true;
	event.preventDefault && event.preventDefault();
	event.stopPropagation && event.stopPropagation();
}

/**
 * [findParentForData найти данные по ближайшей вышестоящей директиве v-for]
 * @param  {[Node]}  element [элемент]
 * @param  {[D_Component]} ctx [context]
 * @prarm  {[String]} prop_name [name of prop]
 * @return {[Bool / Object]}  
 *                  [не найдено такой директивы]
 *                  [
	 *                  {
	 *                  	{[String]} data [Содержание значения директивы]
	 *                  	{[Node]} element [Элемент директивы]
	 *                  }
 *                  ]
 */
function findParentForData(element, ctx, prop_name) {

	var prew = element,
		parent = element.parentNode,
		is_comp = false,
		is_for = false,
		m = null;


	do {

		is_comp = isComponent(parent);
		if(is_comp) {
			return false;
		}

		is_for = isFor(parent);
		if(is_for) {

			var a = 0;
			var ret = false;
			//console.log("!!!!!!!!!!!!")
			//console.log(parent.children)
			for(var i in parent.children) {
				var el = parent.children[i];
				if(typeof el.nodeType!=='undefined') {
					if(el.isSameNode(prew)) {
						var attr = parent.getAttribute('d-for');

						if(reg.for.test(attr)) {
							ret = attr.match(reg.for)[2]+"["+a+"]";
						}
						else if (reg.for_KEY_VALUE_test.test(attr)) {
							var matches = attr.match(reg.for_KEY_VALUE_match);
							if(matches[1]===prop_name) {
								ret = a;
							}
							else {
								ret = matches[3]+"["+a+"]";
								m = a;
							}
						}
					}

					a++;
				}

			};

			return {
				data:ret,
				element:parent,
				key: m
			};

		}

		prew = parent;
		parent = parent.parentNode;

	} while(!is_for && !is_comp);

}

/**
 * [isChild является ли элемент дочерним для компонента]
 * @param  {[Node]}  parent 	[элемент клмпонента]
 * @param  {[Node]}  child      [элемент для которого осуществляется поиск]
 * @param  {[Bool]}  ignore_for [игнорировать ли директиву for] 
 * @param  {[Bool]}  debug      [Дебаг]
 * @return {Boolean}
 */
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
 * [$$ хак для сокращения querySelectorAll]
 * Взять из библиотеки bala.js
 * @param  {[String]} selector 	[Селектор]
 * @param  {[Node]} ctx      	[Нода от которой будет выполняться поиск]
 * @return {[Array[Node]]}    
 */
function $$(selector, ctx) {

	"use strict";

	return [].slice.call((ctx || document).querySelectorAll(selector));

};

Element.prototype.on = Element.prototype.addEventListener;

/**
 * Класс описывающий директивы
 * @param  {[Sting]} name  		[имя директивы]
 * @param  {[Function]} code 	[каллбек для директивы]
 * для каждой найденой директивы при изменении значения 
 * свойства компонента будет выполняться код в code
 */
var D_Directive = (function(name, code) {

	// список директив
	var directives = {};
	// коллекция данных для директивы фор
	// хранит массивы объектов 
	// {
	// 	element: [Node] нода директивы
	// 	html: [String] html для повтора
	// }
	var for_storage = [];

	/**
	 *  Конструктор
	 */
	function D_Directive(name, code) {
		this.name = "d-"+name;
		this.code = code;
	}

	/**
	 * [use выполнить код директивы]
	 * @param  {[Node]} element   	[Нода директивы]
	 * @param  {[string]} prop_name [строка с именем св-ва]
	 * @param  {[D_Component]} ctx  [Компонент]
	 */
	D_Directive.prototype.use = function(element, prop_name, ctx) {

		this.code(element, prop_name, ctx);

	}

	/**
	 * [addToForStorage Добавить элемент и данные в хранилище директивы фор]
	 * @param {[Node]} element 		[Элемент]
	 * @param {[String]} html    	[html для повтора]
	 */
	D_Directive.addToForStorage = function(element, html) {
		for_storage.push({
			element: element,
			html: html.toString()
		});
	};

	/**
	 * [getForStorage получить html для повтора для указанного элемента]
	 * @param  {[Node]} element [Элемент]
	 * @return {[Bool / Object]}         [description]
	 */
	D_Directive.getForStorage = function(element) {
		for(var i in for_storage) {
			var s = for_storage[i];
			if(element.isSameNode(s.element)) {
				//console.log(s.html)
				return s.html;
			};
		};

		return false;
	};

	/**
	 * [getDirectives получить список директив]
	 * @return {[type]} [description]
	 */
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
		this.$methods = {};
		this.noreactive_data = {};
		this.$components = [];
		this.$directives = {};
		this.$watch = {};
		this.$listen = {};

	};

	D_component.prototype.$on = function(event_name, code, ctx) {
		if(typeof this.$listen[event_name]==='undefined') {
			this.$listen[event_name] = [];
		}

		this.$listen[event_name].push({
			code:code,
			ctx:ctx
		});
	}

	D_component.prototype.$emit = function(event_name, data) {
		if(typeof this.$listen[event_name]!=='undefined') {
			this.$listen[event_name].forEach(function(code) {
				code.code.call(code.ctx, data);
			});
		}
	}

	D_component.prototype.setData = function(data) {
		
		var self = this;

		for(var i in data.data) {
			(function(i) {	

				self.setProp(i, data.data[i]);

			})(i);
		};

		for(var m in data.methods) {
			this.$methods[m] = data.methods[m].bind(self);
		};

		for(var i in data.watch) {
			this.$watch[i] = data.watch[i];
		};

		if(typeof data.created === 'function') {
			data.created.call(this);
		}

		this.$element.innerHTML = data.template;
		this.parseHTML();

	};

	D_component.prototype.setProp = function(i, value) {

		var self = this;
		//console.error(self.$data[i], i)
		if(typeof self.$data[i]==='undefined') {
			self.noreactive_data[i] = value;

			Object.defineProperty(self.$data, i, {
				enumerable: true,
				get: function() {
					return self.noreactive_data[i];
				},
				set: function(v) {
					if(self.noreactive_data[i] && self.noreactive_data[i].constructor && self.noreactive_data[i].constructor.name === "Array") {
						self.noreactive_data[i] = [];

						for(var j in v) {

							if(typeof v[j] !== 'function') {
								self.noreactive_data[i].push(v[j]);
							}

						}
					}
					else {
						//console.log(i, v)
						self.noreactive_data[i] = v;
					}

					if(typeof self.$directives[i]!=='undefined') {
						self.$directives[i].forEach(function(d){
							//console.log(d)
							console.log("use in set")
							console.log(d)
							d.directive.use(d.element, d.prop, self);

						});
					};

					if(typeof self.$watch[i]!=='undefined') {
						self.$watch[i].call(self);
					}

					if(self.noreactive_data[i] && self.noreactive_data[i].constructor && self.noreactive_data[i].constructor.name === "Array") {

						self.initPush(i);

					};

				}
			});

			if(self.noreactive_data[i] && self.noreactive_data[i].constructor && self.noreactive_data[i].constructor.name === "Array") {

				self.initPush(i);

			};
		}

		else {

			//console.log(i, value)
			self.$data[i] = value;

		}
	}

	D_component.prototype.initPush = function(i) {

		var self = this;
		self.$data[i].push = function(value) {

			var data = [];
			for(var k in self.noreactive_data[i]) {
				//console.log(self.noreactive_data[i][k])
				data.push(self.noreactive_data[i][k]);
			}
			data.push(value);
			self.$data[i] = data;

			self.initPush(i);
		};

		self.$data[i].delete = function(key) {
			var arr = [];
			for(var k in self.noreactive_data[i]) {
				if(k.valueOf()!=key.valueOf()) {
					// console.error(k);
					// console.error(key);
					// console.warn(key==key)
					arr.push(self.noreactive_data[i][k]);
				};
			};

			self.$data[i] = arr;
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

				//console.warn(elements)
				//elements.push(self.$element);
				elements.forEach(function(el) {

					if(!el.hasAttribute("d-path-"+d.name) && isChild(self.$element, el, ignore_for)) {
						
						if(el.hasAttribute(d.name)) {
							
							el.setAttribute("d-path-"+d.name, "true");
							var name = el.getAttribute(d.name);
							//console.log(d.name)

							var prop = self.getConcreteProp(name);
							//console.log(prop)
							d.use(el, prop, self);

							if(typeof self.$directives[prop]==='undefined') {
								self.$directives[prop] = [];
							}

							var obj = {
								element: el,
								directive: d,
								prop: name
							};


							self.$directives[prop].push(obj);
						}

					};

				});

			})(directives[i]);

		};

		D.Search.call(this);	

	};

	D_component.prototype.getConcreteProp = function(prop) {
		if(reg.for.test(prop)) {
			return prop.match(reg.for)[2];
		};
		if(reg.class_VALUE_IF_PROP_test.test(prop)) {
			console.log(prop.match(reg.class_VALUE_IF_PROP_match)[2])
			return prop.match(reg.class_VALUE_IF_PROP_match)[2];
		};
		if(prop, reg.for_KEY_VALUE_test.test(prop)) {
			return prop.match(reg.for_KEY_VALUE_match)[3];
		};
		return prop.match(reg.first_prop)[0];
	}

	D_component.prototype.getValue = function(prop_name, element) {

		var value = "";

		if(reg.simple_prop.test(prop_name) && typeof this.$data[prop_name]!=='undefined') {
			value = this.$data[prop_name];
		}
		else {
			if(typeof prop_name==="number") {
				return prop_name;
			}

			var str,
				args = [],
				send_args = [],
				args_str,
				prefix = "d_"+Rnd(100,999)+"_";

			for(var i in this.$data) {
				args.push(prefix+i);
				send_args.push(this.$data[i]);
			};

			args_str = args.join(",");

			var expression = "return typeof "+prefix+prop_name+"!=='undefined'? "+prefix+prop_name+": void 0;";
			var foo = new Function(args_str, expression);

			value = foo.apply(this, send_args);
		}

		if(typeof value!=='undefined') {
			return value;
		};

		if(typeof element!=='undefined') {
			var data = findParentForData(element, this, prop_name);
			//console.warn(prop_name,data)
			//console.log("!")
			//console.log(data)
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
		//console.log(arguments)
		var c = component_name+", [d-is='"+component_name+"']"+", [d-component='"+component_name+"']"
		$$(c, parent).forEach(function(element) {
			if(element.hasAttribute("d-component-init")) {
				return false;
			}
			if(isChild(parent, element, true)) {
				element.setAttribute("d-component-init", true);
				var c = new D_component(component_name, element);
				c.$root = parent_component.$root;
				c.$parent = parent_component;
				c.setData(data);

				for (var a in element.attributes) {
					var attr = element.attributes[a];
					if((new RegExp("d-bind:[a-zA-Z\_\-]+")).test(attr.nodeName)) {
						var attr_name = attr.nodeName.substring(7, attr.nodeName.length);
						//console.log(element.getAttribute(attr.nodeName))
						var val = parent_component.getValue(element.getAttribute(attr.nodeName), element);
						// console.log(attr_name, val);
						c.setProp(attr_name, val);
					}
				}

				arr.push(c);
			};

		});
		//console.log("!")
		//console.log(arr)

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
		this.$listen = {};

		D.Search.call(this);

	};

	var F = function() {};
	F.prototype = D_component.prototype;
	D.prototype = new F();
	D.prototype.constructor = D;

	D.version = 0.1;

	D.Search = function() {
		var self = this;
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

	var value = ctx.getValue(element.getAttribute("d-text"), element);
	element.innerHTML = value;

});

D_Directive.Create("src", function(element, prop_name, ctx) {

	var value = ctx.getValue(prop_name, element);
	element.src = value;

});

D_Directive.Create("class", function(element, prop_name, ctx) {

	var expression = false,
		value,
		class_name,
		prop = element.getAttribute('d-class');

	if(reg.class_VALUE_IF_PROP_test.test(prop)) {
		var matches = prop.match(reg.class_VALUE_IF_PROP_match);
		expression = matches[2];
		class_name = matches[1];
	}
	else {
		expression = prop;
		class_name = ctx.getValue(expression);

	}
	 

	if(expression) {
		var has = false;
		value = ctx.getValue(expression);

		var has = false;
		if(element.classList.contains(class_name)) {
			has = true;
		}

		console.log(value, has, class_name)

		if(value && !has) {
			element.classList.add(class_name);
		}
		else if (!value && has) {
			element.classList.remove(class_name);
		}
	};

	//console.log(prop_name)
	//console.log(ctx.getValue(prop))

});

D_Directive.Create("if", function(element, prop_name, ctx) {

	var expression = false,
		value,
		display = "none";

	if(reg.simple_prop.test(prop_name)) {
		expression = element.getAttribute("d-if");
	}
	else {
		expression = prop_name;
	}

	value = ctx.getValue(expression);
	if(value) {
		display = "block";
	}

	console.log("!!!!!!!!!!", display)
	window.e = element;
	element.style.display = display;

});

D_Directive.Create("click", function(element, prop_name, ctx) {

	var attr = element.getAttribute("d-click")
	element.on("click", function(e) {
		
		Prevent(e);

		if(reg.function_NAME.test(attr)) {
			if(typeof ctx.$methods[attr] === 'function') {
				ctx.$methods[attr].call(ctx, e);
			}
		}
		else if(reg.function_NAME_ARGS_test.test(attr)) {
			var matches = attr.match(reg.function_NAME_ARGS_match);
			var func_name = matches[1];
			var values = matches[2].split(",").map(function(e) {
				return e.toString().trim()
			});
			var arr = [];
			for (var i in values) {
				arr.push(ctx.getValue(values[i], element));
			};

			if(typeof ctx.$methods[func_name] === 'function') {
				ctx.$methods[func_name].apply(ctx, arr);
			}
		}

	});

});

D_Directive.Create("model", function(element, prop_name, ctx) {

	if(element.value!==ctx.getValue(prop_name)) {
		element.value = ctx.$data[prop_name];
	}
	element.onkeyup = function(e) {
		if(element.value!==ctx.getValue(prop_name)) {
			ctx.$data[prop_name] = element.value;
		}
	}

});

D_Directive.Create("enter", function(element, prop_name, ctx) {

	element.on("keydown", function(e) {
		if(e.key==="Enter") {
			if(typeof ctx.$methods[prop_name] === 'function') {
				ctx.$methods[prop_name].call(ctx, e);
				Prevent(e);
			};
		};
	});

});

D_Directive.Create("for", function(element, prop_name, ctx) {

	var html = D_Directive.getForStorage(element);
	if(!html) {
		//console.log(html)
		var html = element.innerHTML;
		D_Directive.addToForStorage(element, html);
	};

	element.innerHTML = "";
	console.log("!")
	while (element.firstChild) {
	    element.removeChild(element.firstChild);
	}

	if(reg.simple_prop.test(prop_name)) {
		prop_name = "i in "+prop_name;
	}

	// console.log(html)
	// console.log(element.getAttribute("d-for"))
	// console.error(findParentForData(element, ctx, element.getAttribute("d-for")))
	var attr = element.getAttribute("d-for");
	var prop;
	if(reg.for.test(attr)) {
		prop = attr.match(reg.for)[2];
	}
	else if (reg.for_KEY_VALUE_test.test(attr)) {
		var matches = attr.match(reg.for_KEY_VALUE_match);
		prop = matches[3];
	}
	// var props = prop_name.match(reg.for);
	// var prop = props[2];
	var values = ctx.getValue(prop);

	for(var i in values) {
		var v = values[i];
		if(typeof v !== 'function') {

			element.innerHTML += html;
			//D.Search.call(ctx);
		};
	};
	//console.log(element.innerHTML)
	ctx.parseHTML(true);

});






