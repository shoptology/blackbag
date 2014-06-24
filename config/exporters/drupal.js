'use strict';

var exporter = {
	config : {
		options : {
			query_continue : false
		}
	},
	export : function(query_object, db, cb) {
		exporter.get.tables(db, function(results) {
			var tables = [];
			for(var r in results) {
				for(var t in results[r]) {
					if(typeof results[r][t] === 'string') {
						tables.push(results[r][t]);
					}
				}
			}

			console.log(tables);
		})



		var return_data = [{
			post_title : 'Some title'
		}];

		//cb(return_data);
	},
	get : {
		posts : {},
		tables : function(db, cb) {
			db.query({ query : 'SHOW TABLES' }, function(tables) {
				cb(tables);
			});
		}
	}
};

module.exports = exporter;