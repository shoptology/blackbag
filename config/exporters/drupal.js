'use strict';

var async = require('async');

var exporter = {
	config : {
		options : {
			query_continue : false
		}
	},
	export : function(query_object, db, cb) {
		exporter.db = db;

		exporter.get.articles(function(articles) {

			//console.log(articles);

			console.log(articles[0]);
			/*
			var return_data = [{
				post_title : 'Some title'
			}];*/

			cb(articles);
		});
	},
	get : {
		articles : function(cb) {
			exporter.get.tables(function(tables) {
				exporter.db.query({
					query : 'SELECT * FROM `node` WHERE `type` = "article" AND `status` = 1'
				}, function(articles_raw) {
					var articles = [];

					var field_data = [];
					for(var t in tables) {
						if(tables[t].match(/^field_data/) &&
							tables[t] !== 'field_data_field_tags' &&
							tables[t] !== 'field_data_field_image') field_data.push(tables[t]);
					}

					async.each(articles_raw,
						function(article, callback) {
							var id = article.nid;

							async.parallel({
								tags : function(cb_inner) {
									exporter.get.field_tags(id, function(tags) {
										cb_inner(null, tags);
									});
								},
								images : function(cb_inner) {
									exporter.get.field_images(id, function(imgs) {
										cb_inner(null, imgs);
									});
								},
								fields : function(cb_inner) {
									exporter.get.field_multiple(field_data, id, function(fields) {
										cb_inner(null, fields);
									});
								}
							}, function(err, results) {
								article.fields_raw = results.fields;
								article.tags = results.tags;
								article.images = results.images;
								article.body = results.fields.field_data_body.body_value;
								article.summary = results.fields.field_data_body.body_summary;
								articles.push(article);
								callback();
							});
						},
						function(err) {
							cb(articles);
						}
					);
				});
			});
		},
		pages : function(cb) {

		},
		field_multiple : function(field_list, nid, cb) {
			var fields = {};

			async.each(field_list, 
				function(field, callback) {
					var query = 'SELECT * FROM `' + field + '`';

					if(typeof nid === 'number') {
						query += ' WHERE `entity_id` = ' + nid;
					}

					exporter.db.query({
						query : query
					}, function(rows) {
						// Custom handlers for known fields
						if(field == 'field_data_body') {
							fields[field] = {};
							fields[field].body_value = rows[0].body_value;
							fields[field].body_summary = rows[0].body_summary;
						} else {
							// Might want to handle row arrays differently...
							fields[field] = rows;
						}
						
						callback();
					});
				},
				function(err) {
					//console.log(fields);
					cb(fields);
				}
			);
		},
		field_tags : function(nid, cb) {
			var query = 'SELECT `field_tags_tid` FROM `field_data_field_tags`';

			if(typeof nid === 'number') {
				query += ' WHERE `entity_id` = ' + nid;
			}

			exporter.db.query({
				query : query
			},
			function(tags) {
				var tags_processed = [];

				async.each(tags,
					function(tag, callback) {
						var id = tag.field_tags_tid;
						exporter.db.query({
							query : 'SELECT `name` FROM `taxonomy_term_data` WHERE `tid` = ' + id
						}, function(tag_name) {
							tags_processed.push(tag_name[0].name);
							callback();
						});
					},
					function(err) {
						cb(tags_processed);
					}
				);
			});
		},
		field_images : function(nid, cb) {
			var query = 'SELECT `field_image_fid` FROM `field_data_field_image`';

			if(typeof nid === 'number') {
				query += ' WHERE `field_image_fid` = ' + nid;
			}

			exporter.db.query({
				query : query
			},
			function(images) {
				var images_processed = [];

				async.each(images,
					function(image, callback) {
						var id = image.field_image_fid;
						exporter.db.query({
							query : 'SELECT `uri` FROM `file_managed` WHERE `fid` = ' + id
						},
						function(image_uri) {
							// This URI may not be formatted as a full, public URI
							images_processed.push(image_uri[0].uri);
							callback();
						});
					},
					function(err) {
						cb(images_processed);
					}
				);
			});
		},
		tables : function(cb) {
			exporter.db.query({ query : 'SHOW TABLES' }, function(tables_raw) {
				var tables = [];
				for(var tr in tables_raw) {
					for(var t in tables_raw[tr]) {
						if(typeof tables_raw[tr][t] === 'string') {
							tables.push(tables_raw[tr][t]);
						}
					}
				}
				cb(tables);
			});
		}
	}
};

module.exports = exporter;