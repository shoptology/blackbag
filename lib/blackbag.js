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
	DB = require('./database'),
	utils = require('./utils'),
	_  = require('underscore'),
	l = require('lodash'),
	fs = require('fs'),
	path = require('path');

var Blackbag = function(config) {
	var self = this;

	var init = function() {
		// Add in config values for the format used
		if(config.options.format) {
			config = merge_ext_config('config/formatters/' + config.options.format, config);
		}

		// Add in config values for the exporter
		if(config.options.exporter) {
			config = merge_ext_config('config/exporters/' + config.options.exporter, config);
		}

		var db = new DB(config.db);

		utils.clean_filesystem(config.options, config.exports);

		process_data(db, config.options.exporter, config.exports, config.options.map);
	};

	/**
	 * Gets, processes, and saves data
	 * @param db {class} Configured database class
	 * @param exporter {string} Exporter type (eg. wordpress)
	 * @param queries {object} Different sets of data that we want to get
	 * @param map {object} Map of fields that are needed, body content, etc.  
	 */
	var process_data = function(db, exporter, queries, map) {
		if(queries.length == 0) {
			console.log('ERROR: No queries in configuration file');
			console.log('Please check /config/config.js');
			process.exit();
		}

		var queries_data = {
			total : queries.length,
			complete : 0
		};

		var check_status = function() {
			if(queries_data.total == queries_data.complete) {
				process.exit();
			}
		};

		var update_status_and_save = function(data, q_config) {
			console.log(q_config);
			save_data(data, q_config);
			queries_data.complete++;
			check_status();
		};

		var exporter = load_ext_exporter('config/exporters/' + exporter);

		for(var query in queries) {
			var query_config = queries[query];

			// Add in config values for the format used
			if(query_config.options.format) {
				query_config = merge_ext_config('config/formatters/' + query_config.options.format, query_config);
			}

			// Run exporter if exists
			call_exporter(query_config, exporter, db, function(exported_data, query_continue) {
				if(!query_continue) {
					// Query Returned
					update_status_and_save(exported_data.result, query_config);
				} else {
					// We now MAY have some data in exported_data.result
					// Don't know what we would want to do with it
					// Maybe pass it to query?

					db.query(query_config, exporter, function(result, query_config) {
						// Query Returned
						console.log(result);
						update_status_and_save(result, query_config);
					});
				}			
			});
		}
	};

	/**
	 * Organizes and saves data
	 * @param data {object} Data to write
	 * @param query_obj {object} Data's export config (for file naming and such)
	 */
	var save_data = function(data, query_obj) {
		var map = utils.get_config_prop("map", query_obj, {});
		var to = utils.get_config_prop("to", query_obj, './');
		var format = utils.get_config_prop("format", query_obj, 'json').toLowerCase();
		var filename = utils.get_config_prop("filename", query_obj, 'test.html');
		var flatten = (utils.get_config_prop("flatten", query_obj, false)) ? true : false;
		var meta;
		var body;
		var data_parsed = [];

		if(flatten === true) {
			// Mapping currently not supported for flattened data
			// Convert and save flattened
			console.log('Flattening and saving to file...');

			var result = process_content(data, format);
			var target_name = process_filename(filename, {}, query_obj);

			utils.save_to_file(result, to + '/', target_name);
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

				utils.save_to_file(result, to + '/', target_name);

				data_parsed.push(result);
			}
		}
	};

	/**
	 * Filters filenames for dynamic fields and space replacing
	 * @param filename {string} Filename with brace variables ( eg {post_title}.html )
	 * @param post_data {object} Data for the query that we can pull fields from
	 * @param config {object} Config options for some processing
	 * @return {string} Finished filename
	 */
	var process_filename = function(filename, post_data, config) {
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
		var prependDate = utils.get_config_prop('prependDate', config);
		if(prependDate) {
			if(post_data[prependDate]) {
				var format = "YYYY MM DD";
				var d = new Date(post_data[prependDate]);
				filename = d.toFormat(format)+' '+filename;
			}
		}

		// Replace spaces with separator
		var separator = utils.get_config_prop('filenameSeparator', config, '-');

		filename = filename.replace(new RegExp(' ', 'gi'), separator);

		return filename.toLowerCase();
	};

	/**
	 * Processes data according to chosen format
	 * @param data {string} Data to format
	 * @param format {string} Name of formatter to use
	 * @return {string} Compiled, formatted data to write to disk
	 */
	var process_content = function(data, format) {
		var formatter = load_ext_formatter('config/formatters/' + format);
		var processed = formatter.format(data);
		return processed;
	};

	/**
	 * Loads and returns an external exporter or default, blank exporter
	 * @param path {string} Path to exporter
	 * @return {object} Exporter object with config and export function  
	 */
	var load_ext_exporter = function(path) {
		path = path + '.js';
		if(fs.existsSync(path)) {
			var ext = require('../' + path);

			//var exporter = ext.export;
		} else {
			ext = false;
		}

		return ext;
	};

	/**
	 * Loads and returns an external formatter or default, blank formatter
	 * @param path {string} Path to formatter
	 * @return {object} Formatter object with config and format function  
	 */
	var load_ext_formatter = function(path) {
		path = path + '.js';
		console.log('Checking for Formatter', path);
		if(fs.existsSync(path)) {
			var ext = require('../' + path);
			console.log('Formatter loaded!');
		} else {
			console.log('Formatter not found!');
			ext = {
				config : {
					options : {

					}
				},
				format : function(data) {
					return data;
				}
			}
		}

		return ext;
	};

	/**
	 * Loads a formatter and merges its configuration options with the main configuration file
	 * @param path {string} Path to formatter
	 * @param config {object} User-defined configuration
	 * @return {object} Formatter configuration  
	 */
	var merge_ext_config = function(path, config) {
		var ext_config = load_ext_formatter(path).config;

		// Extend objects
		config = l.merge(ext_config, config);

		return config;
	};

	/**
	 * Hook function used to perform custom exports
	 * @param query_obj {object} Data's export config
	 * @param exporter {object} Exporter object
	 * @param db {class} Initialized database class
	 * @return {object} Hooked query result and whether or not to continue using the native query
	 */
	var call_exporter = function(query_obj, exporter, db, cb) {
		var return_data = {
			query_continue : (exporter.config.options.query_continue == true) ? true : false,
			result : false
		};
		if(exporter === false) {
			return_data.query_continue = true;
			cb(return_data);
		} else {
			exporter.export(query_obj, db, function(data, query_continue) {
				return_data.result = data;
				return_data.query_continue = (typeof query_continue === 'undefined') ? return_data.query_continue : query_continue;
				cb(return_data);
			});
		}
	};

	init();
};

var blackbag = new Blackbag(config);
