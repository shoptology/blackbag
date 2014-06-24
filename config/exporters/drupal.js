'use strict';

var exporter = {
	config : {
		options : {
			query_continue : false
		}
	},
	export : function(query_object, database, cb) {
		var db = database;

		var return_data = [{
			post_title : 'Some title'
		}];

		cb(return_data);
	},
	get : {
		posts : {}
	}
};

module.exports = exporter;