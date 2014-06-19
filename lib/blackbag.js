/*
 * blackbag
 * http://goshoptology.com
 *
 * Copyright (c) 2014 Michael May | Ivan Mayes
 * Licensed under the MIT license.
 */

'use strict';

require('date-utils');

var config = require('../config/config'),
	_  = require('underscore'),
	l = require('lodash'),
	fs = require('fs'),
	path = require('path'),
	md = require('html-md'),
	yaml = require('js-yaml');

var Blackbag = function(config) {
	var self = this;
	var db;
	var total_files;

	var init = function() {
		// Add in config values for the format used
		if(config.options.format) {
			config = merge_ext_config('config/formats/'+config.options.format, config);
		}

		// Add in config values for the exporter
		if(config.options.exporter) {
			config = merge_ext_config('config/exporters/'+config.options.exporter, config);
		}

		db = new DB(config.db);

		clean_filesystem(config.options, config.exports);

		get_data(config.options.exporter, config.exports, config.options.map);
	};

	// Gets, processes, and saves data
	var get_data = function(exporter, queries, map) {
		var queries_data = {
			total : queries.length,
			complete : 0
		};

		var exporter = load_ext_exporter('config/exporters/' + exporter);

		for(var query in queries) {
			var query_config = queries[query];

			// Add in config values for the format used
			if(query_config.options.format) {
				query_config = merge_ext_config('config/formats/'+query_config.options.format, query_config);
			}

			db.query(query_config, exporter, function(result, query_config) {
				// Query Returned
				save_data(result, query_config);
				queries_data.complete++;
				check_status();
			});
		}

		var check_status = function() {
			if(queries_data.total == queries_data.complete) {
				process.exit();
			}
		};
	};

	// Writes out data
	var save_data = function(data, query_obj) {
		var map = getConfigProp("map", query_obj, {});
		var to = getConfigProp("to", query_obj, './');
		var format = getConfigProp("format", query_obj, 'json').toLowerCase();
		var filename = getConfigProp("filename", query_obj, 'test.html');
		var flatten = (getConfigProp("flatten", query_obj, false)) ? true : false;
		var meta;
		var body;
		var data_parsed = [];

		if(flatten === true) {
			// Mapping currently not supported for flattened data
			// Convert and save flattened
			console.log('Flattening and saving to file...');

			var result = process_content(data, format);
			var target_name = process_filename(filename, {}, query_obj);

			save_to_file(result, to + '/', target_name);
		} else {
			meta = (map.meta) ? map.meta : [];
			body = (map.body) ? map.body : [];

			// Extract data based on Map
			for(var d in data) {
				var result = {
					meta : {},
					body : {}
				};
				
				for(var p in data[d]) {
					if(meta.length === 0 && body.length === 0) {
						// No Map -- All data in meta
						result.meta[p] = data[d][p];
					} else if(meta.length === 0 || body.length === 0) {
						// No meta or body, sort this out
						if(meta.length === 0) {
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

				// Add custom meta fields
				for(var m in meta) {
					if(typeof meta[m] === 'object') {
						for(var m2 in meta[m]) {
							result.meta[m2] = meta[m][m2];
						}
					}
				}

				// Convert and save
				console.log('Saving to file...');

				result = process_content(result, format);
				var target_name = process_filename(filename, data[d], query_obj);

				save_to_file(result, to + '/', target_name);

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
	};

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
	var save_to_file = function(content, path, filename) {
		if(!fs.existsSync(path)) fs.mkdirSync(path);
		fs.writeFileSync(path + filename, content);
		console.log('Wrote file: ' + path + filename);
		return true;
		/*
		fs.writeFile(path + filename, content, function(err) {
			if(err) {
				console.log(err);
				return false;
			} else {
				console.log("File was saved to "+ path + filename);
				return true;
			}
		});*/
	};

	var load_ext_exporter = function(path) {
		path = path + '.js';
		if(fs.existsSync(path)) {
			var ext = require('../' + path);

			//var exporter = ext.export;
		} else {
			ext = {
				config : {
					options : {

					}
				},
				export : function() {

				}
			}
		}

		return ext;
	};

	// Looks for a format configuration and 
	// replaces the config properties with the main configuration file
	var merge_ext_config = function(path, config) {
		
		var path = path+'.js';
		console.log('Checking for Format config', path);
		if (fs.existsSync(path)) {
			console.log('File Exists!');
			var ext = require('../'+path);

			// Extend objects
			//console.log('Format config:', ext_config );
			config = l.merge(ext.config, config);
			//console.log('New Config', config);
		}

		return config;
	};

	// Finds config properties with proper overwrites for scope
	// prop: (String) name of property to look for
	// query_obj: (Object) object of the current query being run
	// def: (Any) default setting for the property
	var getConfigProp = function(prop, query_obj, def) {
		var p = def;
		if(config.options[prop]) { p = config.options[prop]; }
		if(query_obj.options[prop]) { p = query_obj.options[prop]; }

		return p;
	};

	// Database object class
	// Configures database connections and interactions based on config
	var DB = function(db_config) {
		var self = this;
		
		var db_type = db_config.type;

		// Construct MySQL-specific db object properties
		if(db_type === 'mysql') {
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
				var query_hook_response = query_hook(query_obj, exporter);

				if(query_hook_response.query_continue) {
					console.log(query_hook_response.data);
					// query_hook_response.data -- seems like we would want to 
					// do something with this if continuing with native queries

					var query = query_construct(query_obj);

					console.log(query);

					self.connection.query(query, function(err, rows, fields) {
						if (err) throw err;

						cb(rows, query_obj);
					});
				} else {
					cb(query_hook_response.data, query_obj);
				}
			};

			// Method for closing connection -- if needed
			this.close = self.connection.end;
		}

		// TODO -- placeholder
		if(db_type === 'mongo') {
			this.query = function(query_obj) {
				var query = query_construct(query_obj);
				// Mongo query stuff

			};
		}

		// Hook function to perform custom query actions enhancing or replacing the native query method
		var query_hook = function(query_obj, exporter) {
			return {
				query_continue : (exporter.config.options.query_continue == false) ? false : true,
				data : exporter.export(query_obj)
			};
		};

		// Converts query_obj to a valid query string
		var query_construct = function(query_obj) {
			var query = "";

			if(db_type === 'mysql') {
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
			
		};

		// TODO other databases
	};

	// Reads config options and exports to make a clean working environment
	var clean_filesystem = function(options, exports) {
		if(options.to) {
			rmdir(options.to);
		}

		for(var e in exports) {
			if(exports[e].options) {
				if(exports[e].options.to) rmdir(exports[e].options.to);
			}
		}
	};

	// Recursively delete files
	var rmdir = function(dir, cb) {
		if(fs.existsSync(dir)) {
			var list = fs.readdirSync(dir);
			for(var i = 0; i < list.length; i++) {
				var filename = path.join(dir, list[i]);
				var stat = fs.statSync(filename);

				// Skip fs indicators
				if(filename != '.' && filename != '..') {
					// If dir, recurse; else, delete
					if(stat.isDirectory()) {
						console.log("traverse dir");
						rmdir(filename);
					} else {
						console.log('delete file');
						fs.unlinkSync(filename);
					}
				}
				console.log(filename);
			}
			fs.rmdirSync(dir);
		}
		if(typeof cb !== 'undefined') {
			cb();
		}
	};

	init();
};

var blackbag = new Blackbag(config);
