'use strict';

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

		var return_data = [{
			post_title : 'Some title'
		}];

		cb(return_data);
	}
};

module.exports = exporter;