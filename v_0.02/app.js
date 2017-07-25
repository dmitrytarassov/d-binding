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
			<div d-text="a"></div>
			</div>
		</div>`,

	data: {
		name: 'test2',
		arr: ['olol2', 'eee2']
	},

	methods: {
		foo: function() {
			console.log('bar2')
		}
	}

});

var app = new D("#app");
console.log(app)