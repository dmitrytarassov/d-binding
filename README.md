# D

D - JavaScript MVVM фреймворк с открытым исходным кодом. 

#### Внимание! На денный момент это потенциально 100% legacy code! 

Фреймворк основан на реактивном двустороннем савязывании данных компонента и шаблона. Для передачи данных НЕ используется разметка Handlebars, вместо этого данные передаются в качестве директив. 

Код изначально писался исключительно "Для себя", как попытка реализации двустороннего савязывания данных на чистом JS (ES 2015), как пример синтаксиса использовался vue.js. 

#### Использование фреймворка в production не приветствуется.

### Свойства компонента

> $data: данные компонента

> $methods: доступные методы

> watch: отслеживание данных компонента

> template: Шаблон для рендеринга

> $components: все дочерние компоненты

> $parent: родительский компонент

> $root: root копомнент

### Для передачи событий используется паттерн Observer

> $on: следить за событием

> $emit: послать событие

## Список директив

* d-bind:[[prop name]]
* d-text
* d-class
* d-if (будет заменено на d-show)
* d-click
* d-model
* d-enter (в планах реализация d-keydown)
* d-for

### Инициализация приложения

```html
<div id="app">
	<component_test></component_test>
</div>
```

```javascript
D.component("component_test", {
	template: `
        <div>Test</div>
    `
});
```

### Директива d-bind:[[prop_name]]

Используется для передачи данных дочерним компонентам

Дочернему компоненту в [[prop_name]] будет передано указанное значение

```javascript
D.component("component_test", {
	template: `
        <div>
			<component_user
				d-bind:user="current_user"></component_user>
        </div>
    `,
    data: {
    	current_user: {
    		name: "Mars"
    	}
    }
});

D.component("component_user", {
	template: `
		<span d-text="user.name"></span>
	`,
	data: {
		user: {}
	}
});
```

#### out

```html
<div>
    <component_user d-bind:user="current_user">
        <span d-text="user.name">Mars</span>
    </component_user>
</div>
```

### Директива d-text

#### app
```javascript
D.component("component_test", {
	template: `
        <div d-text="name"></div>
    `,
    data: {
        name: "Your name"
    }
});
```

#### out

```html
<div d-text="name">Your name</div>
```

#### app

```javascript
D.component("component_test", {
	template: `
        <div>
            <span d-text="user.name"></span><span d-text="user.sec_name"></span>
        </div>
    `,
    data: {
        user: {
            name:"Name",
            sec_name: "Second name"
        }
    }
});
```

#### out

```html
<div>
    <span d-text="user.name">Name</span><span d-text="user.sec_name">Second name</span>
</div>
```

### Директива d-class

#### Возможные варианты использования

* Прямое обращение к свойству d-class="class_name" 
* Использование выражений d-class="some ? 'class_one' : 'class_two'"
* Использование синтаксиса d-class="class_name if expression"


#### app

```javascript
D.component("component_test", {
	template: `
        <div d-class="class_name"></div>
    `,
    data: {
        class_name: "test_class"
    }
});
```

#### out

```html
<div d-class="class_name" class="test_class"></div>
```

#### app

```javascript
D.component("component_test", {
	template: `
        <div d-class="list.length > 0 ? 'active' : 'disabled'" class="button">Send</div>
    `,
    data: {
        list: ['one', 'two']
    }
});
```

#### out

```html
<div d-class="class_name" class="active"></div>
```

### Директива d-if (будет заменено на d-show)

Использование:

* d-if="expression"

#### app

```javascript
D.component("component_test", {
	template: `
        <div d-if="show">Test</div>
    `,
    data: {
        show: true
    }
});
```

#### out

```html
<div d-if="show">Test</div>
```

### Директива d-click

```javascript
D.component("component_test", {
	template: `
        <div d-click="Hello">Hello</div>
    `,
    methods: {
        Hello: function() {
            alert("Hello")
        }
    }
});
```

#### out

> alert("Hello")

```javascript
D.component("component_test", {
	template: `
        <div d-click="Hello(name)">Hello</div>
    `,
    data: {
    	name: "Your name"
    },
    methods: {
        Hello: function() {
            alert("Hello, " + this.$data.name)
        }
    }
});
```

#### out

> alert("Hello Your name")

### Директива d-model

Связывает value inpput, select, textarea с даннымы компонента

#### app

```javascript
D.component("component_test", {
	template: `
        <select d-model="select">
			<option value="1">One</option>
			<option value="2">Two</option>
        </select>
    `,
    data: {
    	select: 2
    }
});
```

#### out

```html
<select d-model="select">
	<option value="1">One</option>
	<option selected value="2">Two</option>
</select>
```

### Директива d-enter  (в планах реализация d-keydown)

Навешивает обработчик keydown на элемент, и срабатывает если нажат Enter

####
```javascript
D.component("component_test", {
	template: `
        <input d-enter="Foo" />
    `,
    methods: {
    	Foo: function() {
    		alert("Enter")
    	}
    }
});
```

#### out

> alert("Enter")

### Директива d-for

Используется для повтороного использования участков компонента. При использовании d-for будет выполнен повторный парсинг данных, таким образом в d-for можно помещать новые компоненты

#### app

```javascript
D.component("component_test", {
	template: `
        <div d-for="el in list">
			<span d-text="el"></span>
        </div>
    `,
    data: {
    	list: [
    		"One",
    		"Two"
    	]
    }
});
```

#### out

```html
<div d-for="el in list" d-path-d-for="true">
	<span d-text="el">One</span>
	<span d-text="el">Two</span>
</div>
```

#### app

```javascript
D.component("component_test", {
	template: `
        <div d-for="el in list">
			<component_user
				d-bind:name="el"></component_user>
        </div>
    `,
    data: {
    	list: [
    		"Dima",
    		"Dasha"
    	]
    }
});

D.component("component_user", {
	template: `
		<span d-text="name"></span>
	`,
	data: {
		name: ""
	}
});
```

#### out

```html
<div d-for="el in list" d-path-d-for="true">
    <component_user d-bind:name="el">
        <span d-text="name">Dima</span>
    </component_user>
    
    <component_user d-bind:name="el">
        <span d-text="name">Dasha</span>
    </component_user>
</div>
```



