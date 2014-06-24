'use strict';

var config =  {
	db : {
		type : 'mysql',
		address : 'localhost',
		database : 'drup240',
		table_prefix : '',
		username : 'root',
		password : 'mysql'
	},
	options : {
		exporter : 'drupal',
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
			],
			body : [
				'post_content'
			]
		},
		filenameSeparator : '-'
	},
	exports : [
		/*{
			query : {
				from : 'wp_posts, wp_postmeta, wp_comments',
				where : {
					"wp_posts.ID" : 'wp_postmeta.post_id',
					'wp_posts.post_type' : 'page'
				}
			},
			options : {
				to : 'documents/posts',
				format : 'json',
				filename: '{post_title}.json',
				map : {
					
				}
			}
		},*/
		{
			query : 'SHOW TABLES',
			options : {
				to : '_posts',
				format : 'jekyll',
				filename: '{post_title}.markdown',
				prependDate: 'post_date',
				prependDateFormat: 'YYYY-MM-DD'
			}
		}
	]
};

module.exports = config;