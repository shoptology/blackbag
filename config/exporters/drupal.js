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

		});

		/*
		var return_data = [{
			post_title : 'Some title'
		}];

		//cb(return_data);*/
	},
	get : {
		articles : function(cb) {
			/*
			async.waterfall([
				function(callback) {
					exporter.get.tables(function(tables) {
						var field_data = [];
						for(var t in tables) {
							if(tables[t].match(/^field_data/)) field_data.push(tables[t]);
						}
						callback(null, field_data)
					})
				},
				function(callback) {

				}
			]);*/
			exporter.get.tables(function(tables) {
				var field_data = [];
				for(var t in tables) {
					if(tables[t].match(/^field_data/)) field_data.push(tables[t]);
				}

				exporter.db.query({
					query : 'SELECT * FROM `node` WHERE `type` = "article" AND `status` = 1'
				}, function(articles_raw) {
					console.log(articles_raw);
				});
			});
		},
		pages : function(cb) {

		},
		field_tags : function() {

		},
		field_image : function() {

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