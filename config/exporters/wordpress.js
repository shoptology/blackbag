'use strict';

var exporter = {
	config : {
		type : 'mysql',
		table_prefix : '',
		options : {
			query_continue : true,
			map : {
				body : [
					'post_content'
				]
			}
		}
	},
	export : function(query_object, database, cb) {
		var db = database;

		switch(query_object.query.from) {
			case "wp_posts":
				query_object.query.from = "wp_posts, wp_postmeta";
				if(!query_object.query.where["wp_posts.ID"]) {
					query_object.query.where["wp_posts.ID"] = 'wp_postmeta.post_id';
				}
				// Prepend all where statements with 'wp_posts.'
				
				break;
			default:

				break;
		}

		var return_data = [{
			post_title : 'Some title'
		}];

		cb(return_data);
	}
};

module.exports = exporter;