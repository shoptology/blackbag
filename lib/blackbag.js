/*
 * blackbag
 * http://goshoptology.com
 *
 * Copyright (c) 2014 Michael May | Ivan Mayes
 * Licensed under the MIT license.
 */

'use strict';

var config = require('../config/config'),
	_  = require('underscore'),
	fs = require('fs'),
	md = require('html-md'),
	yaml = require('js-yaml');

var Blackbag = function(config) {
	var self = this;

	var db;
	var exporter = config.exports.exporter;

	var init = function() {
		db = new DB(config.db);
		var data = get_data(config.exports.exporter, config.exports.data, config.exports.map);
	};

	// Gets and converts content data
	var get_data = function(exporter, data, map) {
		for(var d in data) {
			if(!data[d].map) {
				data[d].map = map;
			}

			db.query(data[d], exporter, function(result, query_obj) {
				// Query Returned
				save_data(result, query_obj);
			});
		}
	};

	// Writes out data
	var save_data = function(data, query_obj) {
		var map = query_obj.map;
		var to = query_obj.to;
		var format = query_obj.format.toLowerCase();
		var filename = query_obj.filename;
		var meta;
		var body;
		var data_parsed = [];

		if(typeof map === 'undefined') {
			map = {};
		}

		meta = (map.meta) ? map.meta : [];
		body = (map.body) ? map.body : [];

		// Extract data based on Map
		for(var d in data) {
			var result = {
				meta : {},
				body : {}
			};
			
			for(var p in data[d]) {
				if(meta.length == 0 && body.length == 0) {
					// No Map -- All data in meta
					result.meta[p] = data[d][p];
				} else if(meta.length == 0 || body.length == 0) {
					// No meta or body, sort this out
					if(meta.length == 0) {
						if(body.indexOf(p) !== -1) {
							result.body[p] = data[d][p];
						} else {
							result.meta[p] = data[d][p];
						}
					} else {
						if(meta.indexOf(p) !== -1) {
							result.meta[p] = data[d][p];
						}
					}
				} else {
					// Full Map present
					if(meta.indexOf(p) !== -1 && meta.length > 0) {
						result.meta[p] = data[d][p];
					}

					if(body.indexOf(p) !== -1 && body.length > 0) {
						result.body[p] = data[d][p];
					}
				}
			}

			// Convert and save
			console.log('Saving to file...');

			result = process_content(result, format);

			var target_name = process_filename(filename, data[d]);
			save_to_file(result, to+'/'+target_name);

			data_parsed.push(result);
		}

		//console.log(data_parsed);

		//console.log('ready to save', data);
		// Convert data to correct formats

		
	};

	// Filters filenames
	var process_filename = function(formula, post_data, spaceReplace) {
		
		// Iterate through {var} and replace with post data
		_.each(post_data, function(v,k) {
			formula = formula.replace(new RegExp('{'+k+'}', 'gi'), v);
		});

		// Replace spaces with dashes
		if(!spaceReplace) spaceReplace = config.filenameSpaceReplace;
		formula = formula.replace(new RegExp(' ', 'gi'), spaceReplace);

		return formula.toLowerCase();
	}

	// Convert data to preferred format
	var process_content = function(data, format) {
		var processed;

		switch(format) {
			case 'json':
				processed = JSON.stringify(data);
				break;
			case 'yaml':
				processed = yaml.dump(data);
				break;
			case 'markdown':
			case 'md':
				
				break;
			case 'jekyll':
				processed = '---\n' + yaml.dump(data.meta) + '---\n';
				for(var b in data.body) {
					processed += md(data.body[b]);
				}
				break;
			case 'docpad':
				processed = '---\n' + yaml.dump(data.meta) + '---\n';
				for(var b in data.body) {
					processed += data.body[b];
				}
				break;
			case 'handlebars':

				break;
		}

		return processed;
	};

	// Saves file to system
	var save_to_file = function(content, path) {
		fs.writeFile(path, content, function(err) {
			if(err) {
				console.log(err);
				return false;
			} else {
				console.log("File was saved to "+path);
				return true;
			}
		}); 
	};

	// Database object class
	// Configures database connections and interactions based on config
	var DB = function(db_config) {
		var self = this;
		
		var db_type = db_config.type;

		// Construct MySQL-specific db object properties
		if(db_type == 'mysql') {
			var mysql = require('mysql');
			var table_prefix = db_config.table_prefix;

			// See mysql module documentation for ssl connections.
			this.connection = mysql.createConnection({
				host : db_config.address,
				database : db_config.database,
				user : db_config.username,
				password : db_config.password
			});

			// Interface for 
			this.query = function(query_obj, exporter, cb) {

				var query = query_construct(query_obj, exporter);

				console.log(query);

				self.connection.query(query, function(err, rows, fields) {
					if (err) throw err;

					cb(rows, query_obj);
				});
			};

			this.close = self.connection.end;
		}

		// TODO -- placeholder
		if(db_type == 'mongo') {
			this.query = function(query_obj) {
				var query = query_construct(query_obj);
				// Mongo query stuff

			}
		}

		// Converts query_obj to a valid query string
		var query_construct = function(query_obj, exporter) {
			// 
			var exporter;
			var query = "";

			// Unfinished query work
			if(db_type == 'mysql') {
				
				if(query_obj.query) {
					query = query_obj.query;
				}else{	// Build query from config
					query = "SELECT * ";
					if(!query_obj.from) return false;
					query += "FROM "+query_obj.from+ " ";
					
					// Where
					if(query_obj.where && typeof query_obj.where === 'object') {
						query += "WHERE ";
						var i = 0;
						_.each(query_obj.where, function(v, k) {
							query += k + '="' + v + '" ';
							//console.log(i, _.size(query_obj.where)-1);
							if( i < _.size(query_obj.where)-1 ) query += 'AND ';
							i++;
						});
					}
				}

			}
			
			//console.log(query);
			return query;
			
		}

		// TODO other databases
	};

	init();
};

var blackbag = new Blackbag(config);
