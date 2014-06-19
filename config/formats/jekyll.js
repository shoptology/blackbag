'use strict';

var jekyll_config =  {
	options : {
		prependDate: 'post_date',
		prependDateFormat: 'YYYY-MM-DD',
		filename: '{post_title}.html',
		filenameSeparator : '-'
	}
};

module.exports = jekyll_config;