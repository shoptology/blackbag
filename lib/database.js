'use strict'

/**
 * Database object class. Configures database connections and interactions
 * based on configuration options.
 * @param db_confg {object} Database configuration object
 */

var _ = require('underscore');

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
			var query = query_construct(query_obj);

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
	if(db_type === 'mongo') {
		this.query = function(query_obj) {
			var query = query_construct(query_obj);
			// Mongo query stuff

		};
	}

	/**
	 * Converts query_obj into a valid query based on database type in config
	 * @param query_obj {object} Data's export config
	 * @return {string} Constructed query
	 */
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
						if( i < _.size(query_obj.query.where)-1 ) query += 'AND ';
						i++;
					});
				}
			}

		}
		
		return query;
	};
};

module.exports = DB;