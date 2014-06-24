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
	export : function(query_object) {
		return '**SOME-DATA***';
	}
};

module.exports = exporter;