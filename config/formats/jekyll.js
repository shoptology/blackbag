'use strict';

var formatter =  {
	config : {
		options : {
			prependDate: 'post_date',
			prependDateFormat: 'YYYY-MM-DD',
			filename: '{post_title}.html',
			filenameSeparator : '-'
		}
	},
	format : function() {
		
	}
};

module.exports = formatter;