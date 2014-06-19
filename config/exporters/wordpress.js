'use strict';

var exporter = {
	config : {
		options : {
			query_continue : false
		}
	},
	export : function(query_object) {
		return '**SOME-DATA***';
	}
};

module.exports = exporter;