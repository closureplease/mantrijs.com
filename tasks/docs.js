/*
 * grunt docs
 * http://gruntjs.com/
 *
 * Copyright (c) 2013 grunt contributors
 * Licensed under the MIT license.
 */

module.exports = function (grunt) {
  'use strict';

  var fs = require('fs'),
    exec = require('child_process').exec,
    jade = require('jade'),
    highlighter = require('highlight.js'),
    docs = require('./lib/docs').init(grunt);

  /**
   * Custom task to generate grunt documentation
   */
  grunt.registerTask('docs', 'Compile Project Docs to HTML', function () {
    var done = this.async();

    // clean the wiki directory, clone a fresh copy
    exec('git clone ' + grunt.config.get('wiki_url') + ' tmp/wiki', function (error) {
      if (error) {
        grunt.log.warn('Warning: Could not clone the wiki! Trying to use a local copy...');
      }

      if (grunt.file.exists('tmp/wiki/' + grunt.config.get('wiki_file'))) {
        // confirm the wiki exists, if so generate the docs
        generateDocs();
      } else {
        // failed to get the wiki
        grunt.log.error('Error: The wiki is missing...');
        done(false);
      }
    });

    /**
     * generate the docs based on the github wiki
     */
    function generateDocs() {
      // marked markdown parser
      var marked = require('marked');
      // Set default marked options
      marked.setOptions({
        gfm:true,
        anchors: true,
        base: '/',
        pedantic:false,
        sanitize:true,
        // callback for code highlighter
        highlight:function (code) {
          return highlighter.highlight('javascript', code).value;
        }
      });

      // project guides - wiki articles that are not part of the project api
      generateGuides();

      // project api docs - all wiki articles
      generateAPI();

      done(true);


      /**
       *
       * Helper Functions
       *
       */

      /**
       * Generate grunt guides documentation
       */
      function generateGuides() {
        grunt.log.ok('Generating Guides...');

        // API Docs
        var sidebars = [],
          base = 'tmp/wiki/',
          names = grunt.file.expand({cwd:base}, ['Getting-Started.md']);

        //sidebars[0] = getSidebarSection('## Documentation');

        names.forEach(function (name) {

          var title = name.replace(/-/g,' ').replace('.md', ''),
            segment = name.replace(/ /g,'-').replace('.md', '').toLowerCase(),
            src = base + name,
            dest = 'build/' + name.replace('.md', '').toLowerCase() + '/index.html';

          grunt.file.copy(src, dest, {
            process:function (src) {
              try {
                var file = 'src/tmpl/docs.jade',
                  templateData = {
                    page:'docs',
                    rootSidebar: true,
                    pageSegment: segment,
                    title:title,
                    content: docs.anchorFilter( marked( docs.wikiAnchors(src) ) ),
                    sidebars: []
                  };
                return jade.compile(grunt.file.read(file), {filename:file})(templateData);
              } catch (e) {
                grunt.log.error(e);
                grunt.fail.warn('Jade failed to compile.');
              }
            }
          });
        });
        grunt.log.ok('Created ' + names.length + ' files.');
      }


      /**
       * Generate grunt API documentation
       */
      function generateAPI() {
        grunt.log.ok('Generating API Docs...');
        // API Docs
        var sidebars = [],
          base = 'tmp/wiki/',
          names = grunt.file.expand({cwd:base}, ['*.md', '!*utils*']);

        names = names.map(function (name) {
          return name.substring(0, name.length - 3);
        });

        // the default api page is special
        //names.push('grunt');
        // TODO: temporary store for these
        //names.push('Inside-Tasks');
        //names.push('Exit-Codes');

        // get docs sidebars
        sidebars[0] = getSidebarSection('## The Web API', 'Web API');
        sidebars[1] = getSidebarSection('## The Command Line Interface', 'The CLI');
        sidebars[2] = getSidebarSection('## Grunt Tasks', 'Grunt Tasks');

        names.forEach(function (name) {
          var src = base + name + '.md';
          var dest = 'build/api/';

          if ('home' === name.toLowerCase()) {
            dest += 'index.html';
          } else {
            dest += name.toLowerCase() + '/index.html';
          }
          grunt.file.copy(src, dest, {
            process:function (src) {
              try {
                var file = 'src/tmpl/docs.jade',
                  templateData = {
                    page:'api',
                    pageSegment: name.toLowerCase(),
                    title:name.replace(/-/g,' '),
                    content: docs.anchorFilter( marked( docs.wikiAnchors(src) ) ),
                    sidebars: sidebars
                  };

                return jade.compile(grunt.file.read(file), {filename:file})(templateData);
              } catch (e) {
                grunt.log.error(e);
                grunt.fail.warn('Jade failed to compile.');
              }
            }
          });
        });
        grunt.log.ok('Created ' + names.length + ' files.');
      }


      /**
       * Get sidebar list for section from Home.md
       */
      function getSidebarSection(section, sectionName, iconClass) {
        var rMode = false,
          l,
          items = [];

        // the title
        items.push({name: sectionName, icon: iconClass});

        // read the Home.md of the wiki, extract the section links
        var lines = fs.readFileSync('tmp/wiki/Home.md').toString().split('\n');
        for(l in lines) {
          var line = lines[l];
          // choose a section of the file
          if (line === section) { rMode = true; }
          // end of section
          else if (line.match(/\#\#/)) { rMode = false; }

          var itemsMatch = line.match(/\[\[(.*)\]\]/);


          if (itemsMatch && itemsMatch.length && rMode && line.length > 0) {
            var item = itemsMatch[1];
            var url = item;
            items.push({name: item, url: url.replace(/ /g,'-').toLowerCase()});
          }
        }

        if (1 === items.length) { return []; }
        return items;
      }

    }
  });

};
