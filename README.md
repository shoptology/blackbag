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
	* **type** (String): Defines the database type used by the CMS
	* **address** (String): Defines the database URL
	* **database** (String): Defines the database to use on the server
	* **username** (String): Defines the username used to connect to the database
	* **password** (String): Defines the password used to connect to the database
* **exporter** (String): Points to an exporter config file that will create defaults for that type of CMS
* **map** (Object): Defines the data mapping for files to be written
	* **meta** (Array): Defines the list of fields to be included in an object's meta field
		* **element** (String / Object): Use a String to map to a database object or an Object to define custom meta data
	* **body** (Array): Defines the list of fields to be added to an object's body field
* **query** (Object / String): Defines what data to be pull from the database; if a String, the raw query string is used
	* **from** (String): Defines the table/collection to get data from
	* **where** (Object): Defines conditions that must be satisfied for a piece of content to be returned
* **to** (String): Path to save files to
* **format** (String): File or Flatfile format to export to
* **filename** (String): Template for file file names
* **filenameSeperator** (String): Character to use for word separation in file names
* **prependDate** (String): Defines the date field to use at the beginning of the saved file
* **prependDateFormat** (String): Defines the format used to display the date in the filename
* **flatten** (Boolean): Defines whether or not all results from a query should be combined into a single result (good for exporting options tables)

### Exporters & Formatters
Exporters and formatters are preset configs for different CMS' and Static File Generators.  Each config will fill in defaults into your config, unless you specify that config setting in your master config.  To use a exporter, add `exporter:EXPORTERNAME` to the config options object.  To use a formatter, add `format:FORMATTERNAME`.  

You can also build your own exporter/formatter by copying a sample file and inserting your default options and exporting / formatting functions.  If you get an exporter or fomatter working, please submit a pull request and we will include it in the project!

#### Currently supported exporters:
* Wordpress
* Drupal
* Build your own!

#### Currently supported formatters:
* JSON
* Markdown
* Jekyll
* Docpad
* Build your own!

### Samples
Included are configuration samples for a few combinations of CMS to flat file.  Also included is the 'all options' config file for reference.


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## License
Copyright (c) 2014 Michael May | Ivan Mayes. Licensed under the MIT license.
