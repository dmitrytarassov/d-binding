D.component("component_header", {

	template: `
<div class="header">
	<div class="input_container">
		<input type="text" class="new_item" placeholder="Название товара" 
			d-model="name"
			d-enter="addToList"/>
		<div class="clear"
			d-click="clear">&#x2716;</div>
	</div>
	<div class="button"
		d-class="active if state"
		d-click="addToList">Добавить</div>
</div>
	`,

	data: {
		name: "",
		state:false
	},

	methods: {
		clear: function() {
			this.$data.name = ""
		},
		addToList: function() {
			if(this.$data.state) {
				this.$parent.$emit("addToList", this.$data.name);
				this.$data.name = "";
			}
		}
	}, 

	watch: {
		name: function() {
			if(this.$data.name.length) {
				this.$data.state = true;
			}
			else {
				this.$data.state = false;
			}
		},
		state: function() {
			console.log(this.$data.state)
		}
	}
});

D.component("component_shopping", {

	template: `
<div class="shopping">
	<component_header></component_header>
	<div class="" d-for="e in list">
		<div class="list_element">
			<span d-text="e"></span>
		</div>
	</div>
	<div class="buttons"
		d-if="list.length > 0">
		<div class="button clear_list"
			d-click="clearList">Очистить</div>
		<div class="button save"
			d-click="Save">Сохранить</div>
	</div>
</div>
	`,

	data: {
		list: []
	},

	methods: {
		clearList:function() {
			this.$data.list = [];
		},
		Save: function() {
			localStorage.setItem('shoppingList', JSON.stringify(this.$data.list));
		}
	},

	created: function() {
		this.$on("addToList", function(item) {
			this.$data.list.push(item);
		}, this);

		if(typeof localStorage.shoppingList !== 'undefined') {
			this.$data.list = JSON.parse(localStorage.shoppingList);
		}
	}

});

var app = new D("#app");