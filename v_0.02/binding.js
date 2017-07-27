var reg = {
	// поиск for директивы
	for: new RegExp("([a-zA-Z\_]+)\ in\ ([a-zA-Z\_]+)"),
	// получение первого значения, до "[" или "."
	first_prop: new RegExp("^[a-zA-Z\_]+"),
	// является ли значение целым без "[" или "."
	simple_prop: new RegExp("^[a-zA-Z\_]+$"),
	//
	class_VALUE_IF_PROP_test: new RegExp("^[a-zA-Z\_\-]+\ if\ [a-zA-Z\_]+$"),
	//
	class_VALUE_IF_PROP_match: new RegExp("^([a-zA-Z\_\-]+) if ([a-zA-Z\_]+)")
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
 * @return {[Bool / Object]}  
 *                  [не найдено такой директивы]
 *                  [
	 *                  {
	 *                  	{[String]} data [Содержание значения директивы]
	 *                  	{[Node]} element [Элемент директивы]
	 *                  }
 *                  ]
 */
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
			//console.log("!!!!!!!!!!!!")
			//console.log(parent.children)
			for(var i in parent.children) {
				var el = parent.children[i];
				if(typeof el.nodeType!=='undefined') {
					if(el.isSameNode(prew)) {
						ret = parent.getAttribute('d-for').match(reg.for)[2]+"["+a+"]";
					}

					a++;
				}

			};

			return {
				data:ret,
				element:parent
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
		this.methods = {};
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
				console.log(data)
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

		for(var i in data.methods) {
			this.methods[i] = data.methods[i];
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

					if(!el.hasAttribute("d-path-"+d.name) && isChild(self.$element, el, ignore_for)) {
						
						el.setAttribute("d-path-"+d.name, "true");
						var name = el.getAttribute(d.name);
						console.log(d.name)

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
		if(reg.class_VALUE_IF_PROP_test.test(prop)) {
			console.log(prop.match(reg.class_VALUE_IF_PROP_match)[2])
			return prop.match(reg.class_VALUE_IF_PROP_match)[2];
		}
		console.log(prop)
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
		$$(component_name, parent).forEach(function(element) {
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

		D.Search.call(this);

	};

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

	var value = ctx.getValue(prop_name, element);
	element.innerHTML = value;

});

D_Directive.Create("class", function(element, prop_name, ctx) {

	var expression = false,
		value,
		class_name;

	if(reg.simple_prop.test(prop_name)) {
		expression = prop_name;
		class_name = element.getAttribute("d-class").match(reg.class_VALUE_IF_PROP_match)[1];

	}
	else if(reg.class_VALUE_IF_PROP_test.test(prop_name)) {
		var matches = prop_name.match(reg.class_VALUE_IF_PROP_match);
		expression = matches[2];
		class_name = matches[1];
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

	element.addEventListener("click", function(e) {

		if(typeof ctx.methods[prop_name] === 'function') {
			ctx.methods[prop_name].call(ctx, e);
			Prevent(e);
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

	element.addEventListener("keydown", function(e) {
		if(e.key==="Enter") {
			if(typeof ctx.methods[prop_name] === 'function') {
				ctx.methods[prop_name].call(ctx, e);
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

	console.log(html)
	
	var props = prop_name.match(reg.for);
	var prop = props[2];
	var values = ctx.getValue(prop);
	

	console.log(values)

	for(var i in values) {
		var v = values[i];
		if(typeof v !== 'function') {
			console.log(html)
			element.innerHTML += html;
			//D.Search.call(ctx);
		};
	};
	console.log(element.innerHTML)
	ctx.parseHTML(true);

});






