/*jshint camelcase:false */

var path = require('path');


module.exports = function(grunt) {

  var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;

  var folderMount = function folderMount(connect, point) {
    return connect.static(path.resolve(point));
  };


  // Project configuration.
  grunt.initConfig({
    // server port, used to serve the site and run tests
    server_port: 5678,
    // wiki url
    wiki_url: 'https://github.com/closureplease/mantri.wiki.git',
    // wiki file check, file that exists in the wiki for sure
    wiki_file: 'Home.md',

    // clean directories
    clean: {
      build: ['build/'],
      tmp: ['tmp/']
    },
    // compile less -> css
    less: {
      development: {
        options: {
          paths: ['src/less']
        },
        files: {
          'build/css/main.css': 'src/less/main.less'
        }
      },
      production: {
        options: {
          paths: ['src/less'],
          yuicompress: true
        },
        files: {
          'build/css/main.css': 'src/less/main.less'
        }
      }
    },

    watch: {
      less: {
        files: 'src/less/*.less',
        tasks: ['less:development']
      },
      tmpl: {
        files: 'src/tmpl/**/*.jade',
        tasks: ['jade']
      },
      js: {
        files: 'src/js/**',
        tasks: ['concat']
      },
      other: {
        files: 'src/img/**',
        tasks: ['default']
      },
      livereload: {
        files: 'build/**',
        tasks: ['livereload']
      }
    },
    connect: {
      livereload: {
        options: {
          // limit the watch to just one file, no need for more,
          // whole folders gets cleaned.
          base: 'build/',
          port: '<%= server_port %>',
          middleware: function(connect) {
            return [lrSnippet, folderMount(connect, 'build/')];
          }
        }
      }
    },
    open: {
      server: {
        path: 'http://localhost:<%= connect.livereload.options.port %>'
      }
    },

    // compile page layouts
    jade: {
      notfound: {
        options: {
          data: {
            page: 'notfound',
            title: '404 Not Found'
          }
        },
        files: {
          'build/404.html': 'src/tmpl/404.jade'
        }
      },
      index: {
        options: {
          data: {
            page: 'index',
            title: 'Mantri Javascript Dependency System'
          }
        },
        files: {
          'build/index.html': 'src/tmpl/index.jade'
        }
      }
    },

    concat: {
      // if we add more js, modify this properly
      plugins: {
        src: [
          'src/js/vendor/lib/jquery.js',
          'src/js/vendor/lib/lodash.js',
          'src/js/vendor/*.js',
          'src/js/*.js'
        ],
        dest: 'build/js/plugins.js'
      }
    },

    // copy site source files
    copy: {
      assets: {
        files: [
          {expand: true, cwd: 'src/', src: ['img/**', 'fonts/**', 'js/vendor/lib/modernizr.min.js'], dest: 'build/'}
        ]
      },
      root: {
        files: [
          {expand: true, cwd: 'src/', src: ['*'], dest: 'build/', filter: 'isFile'}
        ]
      }
    },
    nodeunit: {
      all: ['test/*_test.js']
    },
    githubPages: {
      target: {
        options: {
          // The default commit message for the gh-pages branch
          commitMessage: 'push push'
        },
        // The folder where your gh-pages repo is
        src: 'build',
        dest: 'build_git'
      }
    }
  });

  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // Load local tasks
  grunt.loadTasks('tasks'); // getWiki, docs tasks

  grunt.registerTask('build', [
    'clean',
    'copy',
    'jade',
    'less:development',
    'docs',
    'blog',
    'plugins',
    'concat'
  ]);
  grunt.registerTask('default', ['build', 'less:production', 'server']);
  grunt.registerTask('dev', ['build', 'less:development', 'jshint', 'watch']);
  grunt.registerTask('test', ['nodeunit']);
  grunt.registerTask('deploy', ['githubPages:target']);
  grunt.registerTask('server', [
    'livereload-start',
    'connect:livereload',
    'watch'
  ]);
};
