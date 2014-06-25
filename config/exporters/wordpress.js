'use strict';

var async = require('async'),
	_ = require('underscore');

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
				
				// Prepend all empty where statements with 'wp_posts.'
				query_object.query.where = db.prependObjectProperties(query_object.query.where, 'wp_posts');
				console.log('Where', query_object.query.where);

				db.query( query_object, function(rows) {
					var result = [];

					// Loop through tables and get post_meta for each post
					console.log('Getting Meta for Posts');
					async.forEach(rows, function (v, next){ 
						db.query( "SELECT meta_key, meta_value FROM wp_postmeta WHERE post_id = "+v.ID+" " , function(meta_rows) {
							//console.log('meta_rows', meta_rows);

							// Add meta values to existing row object
							_.each(meta_rows, function(meta_row,k) {
								v[meta_row.meta_key] = meta_row.meta_value;
							});

							// Get Taxonomy
							console.log('Getting Taxonomies for posts...');
							db.query( "SELECT taxonomy, name, slug, ta.term_id FROM wp_term_taxonomy ta INNER JOIN wp_terms te on ta.term_id = te.term_id INNER JOIN wp_term_relationships tr on ta.term_taxonomy_id = tr.term_taxonomy_id WHERE object_id = "+v.ID , function(taxes) {
								// Add meta values to existing row object
								_.each(taxes, function(tax,k) {
									// Get our type then delete
									var type = tax.taxonomy;
									if(!v[type]) {
										v[type] = [];
									}
									delete tax.taxonomy;

									v[type].push(tax);
								});
								
								// Add our complete post to our result
								result.push(v);

								next();

							});

						});
						
					}, function(err) {

						cb(result);
					
					});

				});

				break;
			default:
				cb({}, true);

				break;
		}

	}
};

module.exports = exporter;