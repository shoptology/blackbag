'use strict';

var exporter = {
	config : {
		options : {
			query_continue : true
		}
	},
	export : function(query_object) {
		return '**SOME-DATA***';
	}
};

module.exports = exporter;