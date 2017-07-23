document.addEventListener('DOMContentLoaded', function() {



	var nav = new D('nav_button', function() {
		return new Promise((resolve, reject) => {
			resolve(() => {
				if(typeof this.props.is_active === "undefined") {
					this.props.is_active = false;
				}

				this.props.fa_icon = "fa fa-"+this.props.icon;
				this.methods.navClick = () => {
					this.parent.emit("active_menu", this.props.name);
				};

				this.parent.on("active_menu", (val) => {
					this.props.is_active = (val===this.props.name);
				});

				this.watch.is_active = () => {
					//console.log(this.props.is_active)
				};
			});
		});
	});


	var nav = new D('picture', function() {
		return new Promise((resolve, reject) => {
			resolve(() => {
				this.methods.clickPicture = () => {
					this.root.emit("show_picture", this.props.src);
				};
			});
		});
	});

	var nav = new D('full_screen_picture', function() {
		return new Promise((resolve, reject) => {
			resolve(() => {
				this.props.is_active = false;
				this.props.src = null;

				this.root.on("show_picture", (src) => {
					console.log(src)
					this.props.src = src;
					this.props.is_active = true;
				});

				this.methods.hide = () => {
					this.props.is_active = false;
				}
			});
		});
	});

	var nav = new D('screen', function() {
		return new Promise((resolve, reject) => {
			resolve(() => {
				if(typeof this.props.is_active === "undefined") {
					this.props.is_active = false;
				}

				this.parent.on("active_menu", (val) => {
					this.props.is_active = (val===this.props.name);
					console.log(this.props)
				});
			});
		});
	});

	var nav = new D('app', function() {
		return new Promise((resolve, reject) => {
			resolve(() => {

			});
		});
	});






});