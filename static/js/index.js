// This will be the object that will contain the Vue attributes
// and be used to initialize it.
let app = {};

// Given an empty app object, initializes it filling its attributes,
// creates a Vue instance, and then initializes the Vue instance.
let init = (app) => {
	// This is the Vue data.
	app.data = {
		add_mode: false,
		add_post_content: '',
		rows: [],
		email: '',
		selection_done: false,
		uploading: false,
		uploaded_file: '',
		uploaded: false,
		img_url: '',
	};

	app.enumerate = (a) => {
		// This adds an _idx field to each element of the array.
		let k = 0;
		a.map((e) => {
			e._idx = k++;
		});
		return a;
	};

	app.complete = (posts) => {
		// Initializes useful (rating for now) fields of post.
		posts.map((post) => {
			post.rating = 0;
			post.message = '';
		});
	};

	app.set_rating = (post_idx, rating) => {
		console.log('setting rating: ' + rating);
		let post = app.vue.rows[post_idx];
		post.rating = rating;
		// Sets the stars on the server.
		app.vue.rows[post_idx].rating = rating;
		axios.post(set_rating_url, { post_id: post.id, rating: rating });
	};

	app.add_contact = function () {
		axios
			.post(add_contact_url, {
				post_content: app.vue.add_post_content,
			})
			.then(function (response) {
				app.vue.rows.unshift({
					id: response.data.id,
					post_content: app.vue.add_post_content,
					name: response.data.name,
					email: response.data.email,
				});
				axios
					.get(load_contacts_url)
					.then(function (response) {
						let rows = app.enumerate(response.data.rows);
						app.complete(rows);
						// app.vue.rows.reverse();
						app.vue.email = response.data.email;
						// console.log(app.vue.email === null);
						return rows;
					})
					.then((rows) => {
						// Then we get the post ratings for each image.
						// These depend on the user.
						for (let r of rows) {
							axios
								.get(get_rating_url, { params: { post_id: r.id } })
								.then((result) => {
									r.rating = result.data.rating;
									console.log('r.rating is: ' + r.rating);
								});
						}
						app.vue.rows = rows;
					});

				app.enumerate(app.vue.rows);
				app.reset_form();
				app.set_add_status(false);
			});
	};

	app.reset_form = function () {
		app.vue.add_post_content = '';
	};

	app.delete_contact = function (row_idx) {
		let id = app.vue.rows[row_idx].id;
		axios
			.get(delete_contact_url, { params: { id: id } })
			.then(function (response) {
				for (let i = 0; i < app.vue.rows.length; i++) {
					if (app.vue.rows[i].id === id) {
						app.vue.rows.splice(i, 1);
						app.enumerate(app.vue.rows);
						break;
					}
				}
			});
	};

	app.set_add_status = function (new_status) {
		app.vue.add_mode = new_status;
	};

	app.hover_like = (post_idx) => {
		axios
			.get(get_likes_url, { params: { post_id: app.vue.rows[post_idx].id } })
			.then(function (response) {
				let names = response.data.names;
				let message = '';
				switch (names.length) {
					case 0:
						message = 'Not liked by anyone';
						break;
					case 1:
						message = 'Liked by ' + names;
						break;
					case 2:
						message = 'Liked by ' + names[0] + ' and ' + names[1];
						break;
					default:
						message =
							'Liked by ' +
							names.slice(0, -1).join(', ') +
							', and ' +
							names.slice(-1);
				}
				console.log(message);
				const post = app.vue.rows[post_idx];
				post.message = message;
				app.vue.rows[post_idx].message = message;
			});
	};

	app.hover_dislike = (post_idx) => {
		axios
			.get(get_dislikes_url, { params: { post_id: app.vue.rows[post_idx].id } })
			.then(function (response) {
				let names = response.data.names;
				let message = '';
				switch (names.length) {
					case 0:
						message = 'Not disliked by anyone';
						break;
					case 1:
						message = 'Disiked by ' + names;
						break;
					case 2:
						message = 'Disiked by ' + names[0] + ' and ' + names[1];
						break;
					default:
						message =
							'Disiked by ' +
							names.slice(0, -1).join(', ') +
							', and ' +
							names.slice(-1);
				}
				console.log(message);
				const post = app.vue.rows[post_idx];
				post.message = message;
				app.vue.rows[post_idx].message = message;
			});
	};

	app.hover_out = (post_idx) => {
		let post = app.vue.rows[post_idx];
		post.message = '';
		app.vue.rows[post_idx].message = '';
	};

	app.upload_file = function (event, row_idx) {
		let input = event.target;
		let file = input.files[0];
		let row = app.vue.rows[row_idx];
		if (file) {
			let reader = new FileReader();
			reader.addEventListener('load', function () {
				//sends the image to the server
				axios
					.post(upload_image_url, {
						post_id: row.id,
						image: reader.result,
					})
					.then(function () {
						//Sets the local preview.
						row.image = reader.result;
					});
			});
			reader.readAsDataURL(file);
		}
	};

	// We form the dictionary of all methods, so we can assign them
	// to the Vue app in a single blow.
	app.methods = {
		add_contact: app.add_contact,
		set_add_status: app.set_add_status,
		delete_contact: app.delete_contact,
		set_rating: app.set_rating,
		hover_like: app.hover_like,
		hover_dislike: app.hover_dislike,
		hover_out: app.hover_out,
		upload_file: app.upload_file,
	};

	// This creates the Vue instance.
	app.vue = new Vue({
		el: '#vue-target',
		data: app.data,
		methods: app.methods,
	});

	// And this initializes it.
	// Generally, this will be a network call to the server to
	// load the data.
	// For the moment, we 'load' the data from a string.
	app.init = () => {
		axios
			.get(load_contacts_url)
			.then(function (response) {
				let rows = app.enumerate(response.data.rows);
				app.complete(rows);
				// app.vue.rows.reverse();
				app.vue.email = response.data.email;
				// console.log(app.vue.email === null);
				return rows;
			})
			.then((rows) => {
				// Then we get the post ratings for each image.
				// These depend on the user.
				for (let r of rows) {
					axios
						.get(get_rating_url, { params: { post_id: r.id } })
						.then((result) => {
							r.rating = result.data.rating;
							console.log('r.rating is: ' + r.rating);
						});
				}
				app.vue.rows = rows;
			});
	};

	// Call to the initializer.
	app.init();
};

// This takes the (empty) app object, and initializes it,
// putting all the code i
init(app);
