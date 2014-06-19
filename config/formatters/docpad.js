'use strict';

var yaml = require('js-yaml');

var formatter =  {
	config : {
		options : {
			prependDate: 'post_date',
			prependDateFormat: 'YYYY-MM-DD',
			filename: '{post_title}.html',
			filenameSeparator : '-'
		}
	},
	format : function(data) {
		var processed;

		processed = '---\n' + yaml.dump(data.meta) + '---\n';
		for(var b in data.body) {
			processed += data.body[b];
		}

		return processed;
	}
};

module.exports = formatter;