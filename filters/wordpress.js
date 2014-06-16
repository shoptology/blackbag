'use strict';

var filter = function(query_obj, db_type) {
	// all our crazy query building logic
	"SELECT * FROM `wp_posts` "
	/*
	SELECT * 
	FROM wp_posts, wp_postmeta, wp_comments  
	WHERE wp_posts.ID = wp_postmeta.post_id = wp_comments.comment_post_ID 
	AND wp_posts.post_type = 'page';*/
};

module.exports = build;