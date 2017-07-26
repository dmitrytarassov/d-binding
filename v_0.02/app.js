D.component("component_test", {

	template: `<div
		d-click="foo">

		<component_other_test
			d-bind:name="name"></component_other_test>
	</div>`,

	data: {
		name: 'asdfasdfasdfasd',
		test: {
			name: 'ololo'
		}
	},

	methods: {
		foo: function() {
			console.log('bar1')
		}
	}

});

D.component("component_other_test", {

	template: `<div class='test2_class'>
		<div class=""
			d-for="a in arr"
			>
			<component_tree
				d-bind:test="a"></component_tree>
			</div>
		</div>`,

	data: {
		name: 'test2',
		arr: [{name:'olol2'}, {name:'eee2'}]
	},

	methods: {
		foo: function() {
			console.log('bar2')
		}
	}

});

D.component("component_tree", {

	template: `<div class='test3_class' d-text="test.name">ad</div>`,

	data: {
		test:{name:'ololo'}
	},

	methods: {
		
	}

});

var app = new D("#app");
console.log(app)