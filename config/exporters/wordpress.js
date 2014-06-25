'use strict';

var async = require('async');

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

				// Add Joining where statement
				if ( query_object.query.where ) {
					if (!query_object.query.where["wp_posts.ID"]) {
						query_object.query.where["wp_posts.ID"] = '{wp_postmeta.post_id}';
					}
				}
				
				// Prepend all empty where statements with 'wp_posts.'
				query_object.query.where = db.prependObjectProperties(query_object.query.where, 'wp_posts');
				console.log('Where', query_object.query.where);

				db.query( query_object, function(tables) {
					
					// Loop through tables and get post_meta for each post
					async.forEach(tables, function (k, next){ 
						console.log(k.ID);
						next();
					}, function(err) {
						console.log('iterating done');
						cb(tables);
					}); 

				});

				


				break;
			case "wp_comments":
				query_object.query.from = "wp_comments, wp_commentmeta";

				// Add Joining where statement
				if ( query_object.query.where ) {
					if (!query_object.query.where["wp_comments.comment_ID"]) {
						query_object.query.where["wp_comments.comment_ID"] = '{wp_commentmeta.comment_id}';
					}
				}
				
				// Prepend all empty where statements with 'wp_posts.'
				query_object.query.where = db.prependObjectProperties(query_object.query.where, 'wp_comments');
				console.log('Where', query_object.query.where);
				break;
			default:

				break;
		}

		/*var return_data = [{
			post_title : 'Some title'
		}];*/

		//cb(return_data);
	}
};

module.exports = exporter;