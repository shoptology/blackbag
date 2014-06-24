# Blackbag

CMS to flat-file courier

## Getting Started
Install the module with: `npm install blackbag`

```javascript
node blackbag.js
```

## Configuration
### Master Config
All configuration is done through a master config file at  `config/config.js`.  There are master options such as database configuration or other global settings, and query-level options for each set of data.  You can set any option at either the master or query level.  Setting a query level option will overwrite the master option.

### Options
Sample of all supported options

```javascript
var config =  {
	db : {
		type : 'mysql',
		address : 'blackbag.com',
		database : 'bb',
		table_prefix : '',
		username : 'root',
		password : ''
	},
	options : {
		exporter : 'wordpress',
		map : {
			meta : [
				'ID',
				'post_author',
				'post_date',
				'post_title',
		        }
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
		{
			query : {
				from : 'wp_posts',
				where : {
					post_type : ['page']
				}
			},
			options : {
				to : 'documents',
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
				to : './',
				format : 'json',
				filename : 'wp_options.json',
				flatten : true
			}
		}
	]
};

module.exports = config;
```
### What do the options do?

* **db** (Object): provides database type, and connection details
* **exporter** (String): Points to an exporter config file that will create defaults for that type of CMS
* **map** (Object):
	* **meta** (Array);
	* **body** (Array);
* **query** (Object / String):
	* **from** (String):
	* **where** (Object): 
* **to** (String):
* **format** (String):
* **filename** (String):
* **filenameSeperator** (String):
* **prependDate** (String):
* **prependDateFormat** (String):
* **flatten** (Boolean):

### Exporters & Formatters
Exporters and formatters are preset configs for different CMS' and Static File Generators.  Each config will fill in defaults into your config, unless you specify that config setting in your master config.  To use a exporter, add `exporter:EXPORTERNAME` to the config options object.  To use a formatter, add `format:FORMATTERNAME`.

#### Currently supported exporters:
* Wordpress
* Drupal

#### Currently supported formatters:
* JSON
* Markdown
* Jekyll
* Docpad

### Samples
Included are configuration samples for a few combinations of CMS to flat file.  Also included is the 'all options' config file for reference.


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## License
Copyright (c) 2014 Michael May | Ivan Mayes. Licensed under the MIT license.
