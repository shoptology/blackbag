'use strict'

/**
 * Utility functions
 */

var config = require('../config/config'),
	fs = require('fs'),
 	path = require('path');

var utils = {
	/**
	 * Finds config properties with proper overwrites for scope
	 * @param prop {string} Property name to look for
	 * @param query_obj {object} Data's export config
	 * @param def {string} Default value for property
	 * @return {mixed} Property value based on config  
	 */
	 get_config_prop : function(prop, query_obj, def) {
	 	var p = def;
		if(config.options[prop]) { 
			p = config.options[prop];
		}
		if(query_obj.options[prop]) {
			p = query_obj.options[prop];
		}

		return p;
	 },

	 /**
	 * Writes data to disk in defined file format
	 * @param content {string} Data to write
	 * @param path {string} Destination of written file
	 * @param filename {string} Name of written file
	 * @return {boolean}
	 */
	 save_to_file : function(content, path, filename) {
	 	if(!fs.existsSync(path)) fs.mkdirSync(path);
		fs.writeFileSync(path + filename, content);
		console.log('Wrote file: ' + path + filename);
		// Proooobably need some error checking here to make sure we wrote stuff
		return true;
	 },
	 
	/**
	 * Reads config options and exports to make a clean working environment
	 * @param options {object} Global options object
	 * @param exports {array} Collection of export (query) objects 
	 */
	clean_filesystem : function(options, exports) {
		if(options.to) {
			utils.rmdir(options.to);
		}

		for(var e in exports) {
			if(exports[e].options) {
				if(exports[e].options.to) utils.rmdir(exports[e].options.to);
			}
		}
	},

	/**
	 * Recursively delete files
	 * @param dir {string} Directory to clean
	 * @param cb {function} (Optional) Callback to run on complete
	 */
	rmdir : function(dir, cb) {
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
						utils.rmdir(filename);
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
	}
};

module.exports = utils;