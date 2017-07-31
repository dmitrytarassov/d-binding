function setScreen(screen_name) {
	this.$data.is_active = (screen_name === this.$data.screen_name);
	this.$data.is_active && this.$parent.$emit("setScreenName", this.$data.title);
};

D.component("component_screens", {
	template: `
<div class="app_screen">
	<div d-is="component_header" class=""
		d-if="show_title"></div>

	<div d-is="component_screen_loading" class="screen_container"></div>
	<div d-is="component_screen_favorites" class="screen_container"></div>
	<div d-is="photos" class="screen_container"></div>

	<div d-is="photo" class="screen_container"></div>

	<div class="nav" d-if="show_nav">
		<div d-for="button in buttons">
			<div class="" d-is="nav_button" d-bind:button="button"></div>
		</div>
	</div>
</div>
	`,
	data: {
		buttons:[{icon: 'fa-star', name: 'favorites'}, {icon: 'fa-home', name: 'photos'}],
		show_nav: false,
		show_title: true
	},
	created: function () {
		this.$on("setScreen", function(name) {
			this.$data.show_nav = (name!=='loading');
		}, this);

		this.$root.$on("showPhoto", function() {
			this.$data.show_nav = false;
			this.$data.show_title = false;
		}, this);

		this.$root.$on("hidePhoto", function() {
			this.$data.show_nav = true;
			this.$data.show_title = true;
		}, this);
	}
});

D.component("photo", {
	template: `
<div class="screen full_screen photo_screen" d-if="is_active">
	<div class="overlay" d-click="hideImg"></div>
	<img d-src="src" alt="" />
	<div class="in_favorites" d-click="toggleFavorites">
		<i class="fa fa-star in" d-if="in_favorites"></i>
		<i class="fa fa-star-o" d-if="in_favorites===false"></i>
	</div>
</div>`,
	data: {
		is_active:false,
		src: null,
		in_favorites: false
	},
	created: function() {
		this.$root.$on("showPhoto", function(photo) {
			this.$data.is_active = true;
			this.$data.src = photo;
			this.$data.in_favorites = false;

			this.$root.$emit("getPhotoInFavorites", photo);
		}, this);

		this.$root.$on("isPhotoInFavorites", function(photo) {
			if(photo===this.$data.src) {
				this.$data.in_favorites = true;
			}
		}, this);
	},
	methods: {
		hideImg: function() {
			this.$data.is_active = false;
			this.$data.src = null;
			this.$root.$emit("hidePhoto");
		},
		toggleFavorites: function() {
			this.$data.in_favorites = !this.$data.in_favorites;
			var action = this.$data.in_favorites ? "addToFavorites" : "rmFromFavorites";
			this.$root.$emit(action, this.$data.src);
		}
	}
});

D.component("pic", {
	template: `<img class="photo" d-src="src" d-click="showPhoto" />`,
	data: {
		src: null
	}, 
	methods: {
		showPhoto: function(photo) {
			console.log(this)
			this.$root.$emit("showPhoto", this.$data.src);
		}
	}
});

D.component("photos", {
		template: `
<div class="screen" d-if="is_active">
<div d-for="photo in list">
	<div d-is="pic" d-bind:src="photo"></div>
</div>
</div>
	`,
	data: {
		is_active: false,
		screen_name: "photos",
		title: "Фотографии",
		list: []
	},
	created: function() {
		for(var i = 1; i <= 10; i++) {
			this.$data.list.push("http://lorempixel.com/400/200/sports/"+i+"/")
		}
		this.$parent.$on("setScreen", setScreen, this);
	},
});

D.component("nav_button", {
	template: `<div class="nav_button"
		d-class="active if is_active"
		d-click="showScreen"><i class="fa" d-class="button.icon"></i></div>`,
	data: {
		button: {
			icon: null,
			name: null
		},
		is_active: false
	},
	methods: {
		showScreen: function() {
			this.$parent.$emit("setScreen", this.$data.button.name)
		}
	},
	created: function() {
		this.$parent.$on("setScreen", function(name) {
			this.$data.is_active = (name === this.$data.button.name);
		}, this);
	}
});

D.component("component_screen_loading", {
	template: `
<div class="screen full_screen" d-if="is_active">
	<span class="middle loading">Loading...</span>
</div>`,
	data: {
		is_active: true,
		screen_name: "loading",
		title: "Загрузка"
	},
	created: function() {
		this.$parent.$on("setScreen", setScreen, this);
	}
});

D.component("component_header", {
	template: `
<div class="header" d-text="screen_name"
	d-if="show">
</div>
	`,
	data: {
		screen_name: "...",
		show:false
	},
	created: function() {
		this.$parent.$on("setScreenName", function(screen_name) {
			this.$data.screen_name = screen_name;
		}, this);

		this.$parent.$on("setScreen", function(screen) {
			if(screen!=='loading') {
				this.$data.show = true;
			}
			else {
				this.$data.show = false;
			}
		}, this);
	}
});

D.component("component_screen_favorites", {
	template: `
<div class="screen" d-if="is_active">
	<span class="desclaimer"
		d-if="list.length === 0">Нет фото в избранном</span>
	
	<div d-if="list.length > 0" d-for="photo in list">
		<div d-is="pic" d-bind:src="photo"></div>
	</div>
</div>
	`,
	data: {
		is_active: false,
		screen_name: "favorites",
		title: "Избранное",
		list: []
	},
	watch: {
		list: function() {
			localStorage.setItem("photosList", JSON.stringify(this.$data.list))
		}
	},
	created: function() {
		this.$data.list = localStorage.photosList ? JSON.parse(localStorage.photosList) : [];
		this.$parent.$on("setScreen", setScreen, this);
		setTimeout(() => {
			this.$parent.$emit("setScreen", this.$data.screen_name, this);
		}, 1000);

		this.$root.$on("getPhotoInFavorites", function(photo) {
			if(this.$data.list.length) {
				for(var i in this.$data.list) {
					if(this.$data.list[i]===photo) {
						return this.$root.$emit("isPhotoInFavorites", photo);
					};
				};
			};
			
		}, this);

		this.$root.$on("addToFavorites", function(photo) {
			if(this.$data.list.length) {
				var go = true;

				for(var i in this.$data.list) {
					if(this.$data.list[i]===photo) {
						go = false;
					};
				};

				if(go) {
					this.$data.list.push(photo);
				}
			}
			else {
				this.$data.list.push(photo);
			}
		}, this);

		this.$root.$on("rmFromFavorites", function(photo) {
			for(var i in this.$data.list) {
				if(this.$data.list[i]===photo) {
					console.log(photo)
					return this.$data.list.delete(i);
				};
			};
		}, this);
	}
});

var app = new D("#app");