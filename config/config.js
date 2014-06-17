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
	exports : {
		exporter : 'wordpress',
		map : {
			meta : [
				'ID',
				'post_author',
				'post_date',
				'post_title',
				'post_excerpt',
				'post_name',
				'post_type'
			],
			body : [
				'post_content'
			]
		},
		data : [
			{
				from : 'wp_posts, wp_postmeta, wp_comments',
				where : {
					"wp_posts.ID" : 'wp_postmeta.post_id',
					'wp_posts.post_type' : 'page',
					post_author : '1'
				},
				to : 'documents/posts',
				format : 'json',
				filename: '{post_title}.json',
				map : {
					
				}
			},
			{
				from : 'wp_posts',
				where : {
					post_type : ['page']
				},
				to : 'delete',
				format : 'docpad',
				filename: '{post_title}.html',
				prependDate: 'post_date',
				prependDateFormat: 'YYYY-MM-DD',
			}
		]
	},
	filenameSeparator : '-'
};

module.exports = config;