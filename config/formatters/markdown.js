'use strict';

var md = require('html-md');

var formatter =  {
	config : {
		options : {
			prependDate: 'post_date',
			prependDateFormat: 'YYYY-MM-DD',
			filename: '{post_title}.md',
			filenameSeparator : '-'
		}
	},
	format : function(data) {
		return md(data);
	}
};

module.exports = formatter;