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
	date = require('date-utils'),
	yaml = require('js-yaml');

var Blackbag = function(config) {
	var self = this;
	var db;

	var init = function() {
		db = new DB(config.db);
		var data = get_data(config.options.exporter, config.exports, config.options.map);
	};

	// Gets and converts content data
	var get_data = function(exporter, data, map) {
		for(var d in data) {
			if(!data[d].options.map) {
				data[d].options.map = map;
			}

			db.query(data[d], exporter, function(result, query_obj) {
				// Query Returned
				save_data(result, query_obj);
			});
		}
	};

	// Writes out data
	var save_data = function(data, query_obj) {
		var map = query_obj.options.map;
		var to = query_obj.options.to;
		var format = query_obj.options.format.toLowerCase();
		var filename = query_obj.options.filename;
		var flatten = (query_obj.options.flatten) ? true : false;
		var meta;
		var body;
		var data_parsed = [];

		if(flatten == true) {
			// Mapping currently not supported for flattened data
			// Convert and save flattened
			console.log('Flattening and saving to file...');

			var result = process_content(data, format)
			var target_name = process_filename(filename, {}, query_obj);

			save_to_file(result, to + '/' + target_name);
		} else {
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
				var target_name = process_filename(filename, data[d], query_obj);

				// TODO : Create directory if not exists
				save_to_file(result, to + '/' + target_name);

				data_parsed.push(result);
			}
		}
	};

	// Filters filenames
	var process_filename = function(filename, post_data, query_obj) {
		// Iterate through {var} and replace with post data
		_.each(post_data, function(v,k) {
			filename = filename.replace(new RegExp('{'+k+'}', 'gi'), v);
		});

		// Check for Date prepend
		// returns date formatted with:
			// YYYY - Four digit year
			// MMMM - Full month name. ie January
			// MMM  - Short month name. ie Jan
			// MM   - Zero padded month ie 01
			// M    - Month ie 1
			// DDDD - Full day or week name ie Tuesday 
			// DDD  - Abbreviated day of the week ie Tue
			// DD   - Zero padded day ie 08
			// D    - Day ie 8
			// HH24 - Hours in 24 notation ie 18
			// HH   - Padded Hours ie 06
			// H    - Hours ie 6
			// MI   - Padded Minutes
			// SS   - Padded Seconds
			// PP   - AM or PM
			// P    - am or pm
		var prependDate = getConfigProp('prependDate', query_obj);
		if(prependDate) {
			if(post_data[prependDate]) {
				var format = "YYYY MM DD";
				var d = new Date(post_data[prependDate]);
				filename = d.toFormat(format)+' '+filename;
			}
		}

		// Replace spaces with separator
		var separator = getConfigProp('filenameSeparator', query_obj, '-');

		filename = filename.replace(new RegExp(' ', 'gi'), separator);

		// Return lowercase result
		return filename.toLowerCase();
	}

	// Convert data to preferred format
	var process_content = function(data, format) {
		var processed;
		// Some of these will get a little weird with flattened data...
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

	// Finds config properties with proper overwrites for scope
	// prop: (String) name of property to look for
	// query_obj: (Object) object of the current query being run
	// def: (Any) default setting for the property
	var getConfigProp = function(prop, query_obj, def) {
		var p = def;
		if(config[prop]) p = config[prop];
		if(query_obj.options[prop]) p = query_obj.options[prop];

		return p;
	}

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

			// Interface for database queries
			this.query = function(query_obj, exporter, cb) {

				var query = query_construct(query_obj, exporter);

				console.log(query);

				self.connection.query(query, function(err, rows, fields) {
					if (err) throw err;

					cb(rows, query_obj);
				});
			};

			// Method for closing connection -- if needed
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
				if(query_obj.query.query_string || typeof query_obj.query === 'string') {
					query = (typeof query_obj.query === 'string') ? query_obj.query : query_obj.query.query_string;
				} else {	// Build query from config
					query = "SELECT * ";
					if(!query_obj.query.from) return false;
					query += "FROM "+query_obj.query.from+ " ";
					
					// Where
					if(query_obj.query.where && typeof query_obj.query.where === 'object') {
						query += "WHERE ";
						var i = 0;
						_.each(query_obj.query.where, function(v, k) {
							query += k + '="' + v + '" ';
							//console.log(i, _.size(query_obj.where)-1);
							if( i < _.size(query_obj.query.where)-1 ) query += 'AND ';
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
