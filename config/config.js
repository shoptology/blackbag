'use strict';

var config =  {
	db : {
		type : 'mysql',
		address : 'apps.m11dev.com',
		database : 'bolddental',
		table_prefix : '',
		username : 'root',
		password : '2#perday'
	},
	options : {
		exporter : 'wordpress',
		map : {
			meta : [
				'ID',
				'post_author',
				'post_date',
				'post_title',
				'post_excerpt',
				'post_name',
				'post_type',
				{
					'layout' : 'test_layout'
				}
			]
		},
		filenameSeparator : '-'
	},
	exports : [
		{
			query : {
				from : 'wp_posts',
				where : {
					post_type : ['page']
				}
			},
			options : {
				to : 'delete',
				format : 'jekyll',
				filename: '{post_title}.html',
				prependDate: 'post_date',
				prependDateFormat: 'YYYY-MM-DD'
			}
		},
		{
			query : {
				from : 'wp_options'
			},
			options : {
				to : 'delete',
				format : 'json',
				filename : 'wp_options.json',
				flatten : true
			}
		}
	]
};

module.exports = config;