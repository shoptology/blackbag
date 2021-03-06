'use strict';

var config =  {
	db : {
		type : 'mysql',
		address : 'apps.m11dev.com',
		database : 'bolddental',
		table_prefix : 'wp_',
		username : 'root',
		password : '2#perday'
	},
	options : {
		exporter : 'wordpress',
		map : {
			/*meta : [
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
			],*/
			body : [
				'post_content'
			]
		},
		filenameSeparator : '-'
	},
	exports : [
		{
			query : {
				from : 'wp_post',
				where : {
					'post_type' : 'post'
				}
			},
			options : {
				to : 'delete',
				format : 'jekyll'
			}
		}
	]
};

module.exports = config;