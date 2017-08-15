'use strict';

module.exports = function(grunt) {

    // load tasks
    [
        'grunt-contrib-clean',
        'grunt-lesslint',        
        'grunt-contrib-uglify',
        'grunt-contrib-less',
        'grunt-contrib-copy',
        'grunt-contrib-concat',
        'grunt-contrib-watch',
        'grunt-browser-sync',
        'grunt-processhtml'
    ].forEach(function(task) { grunt.loadNpmTasks(task); });

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),
        
        processhtml: {
            options: {
                data: {
                    title: '<%= pkg.meta.title %>',
                    description: '<%= pkg.meta.description %>',
                    name: '<%= pkg.meta.name %>',
                    author: '<%= pkg.meta.name %>',
                    keywords: '<%= pkg.meta.keywords %>',
                    thumbnail: {
                        src: '<%= pkg.meta.thumbnail %>',
                        width: '400',
                        height: '400'
                    },
                    analytics: '<%= pkg.meta.analytics %>',
                    date: grunt.template.today('yyyy-mm-dd@hh:mm:ss TMZ'),
                    url: '<%= pkg.homepage %>'
                }
            },
            dev: {
                files: {
                    '<%= pkg.sourceFolder %>/index.html': ['<%= pkg.sourceFolder %>/index.md']
                }
            },
            dist: {
                files: {
                    '<%= pkg.sourceFolder %>/index.html': ['<%= pkg.sourceFolder %>/index.md']
                }
            }
        },

        clean: {
            svgbuild: ["<%= pkg.sourceFolder %>/assets/img/png", "<%= pkg.sourceFolder %>/assets/img/svgmin"],
            svgmain: ["<%= pkg.sourceFolder %>/assets/img/grunticon.loader.js", "<%= pkg.sourceFolder %>/assets/img/preview.html"],
            svgdist: ["<%= pkg.distFolder %>/assets/img/grunticon.loader.js", "<%= pkg.distFolder %>/assets/img/preview.html"],
            dist: ["<%= pkg.distFolder %>/assets"]
        },

        uglify: {
            dev: {  
                files: {
                    '<%= pkg.sourceFolder %>/assets/js/main.min.js': ['<%= pkg.sourceFolder %>/assets/js/src/main.js'],
                    '<%= pkg.sourceFolder %>/assets/js/plugins.min.js': ['<%= pkg.sourceFolder %>/assets/js/src/plugins.js']
                }
            },
            dist: {  
                files: {
                    '<%= pkg.sourceFolder %>/assets/js/main.min.js': ['<%= pkg.sourceFolder %>/assets/js/src/main.js'],
                    '<%= pkg.sourceFolder %>/assets/js/plugins.min.js': ['<%= pkg.sourceFolder %>/assets/js/src/plugins.js']
                }
            }
        },

        concat: {
      
            dist: {
                    src: ['<%= pkg.sourceFolder %>/assets/js/plugins.min.js', '<%= pkg.sourceFolder %>/assets/js/main.min.js'],
                    dest: '<%= pkg.sourceFolder %>/assets/js/script.min.js'
            },
        },

      
        less: {

            dev: {  
                files: {
                    '<%= pkg.sourceFolder %>/assets/css/main.css': '<%= pkg.sourceFolder %>/assets/css/frag/layout.less'
                }
            },

            dist: {
                options: {
                    cleancss: true,
                    compress: true,
                    ieCompat: true
                },
                files: {
                   '<%= pkg.distFolder %>/assets/css/layout.css': '<%= pkg.sourceFolder %>/assets/css/frag/layout.less',
                }
            }
    
        },
        
                
        copy: {

            dist: {

                files: [              

                  // css
                  {expand: true, cwd: '<%= pkg.sourceFolder %>/', src: ['assets/css/**.css'], dest: '<%= pkg.distFolder %>/assets/css', filter: 'isFile', flatten: true},

                  // images/png
                  {expand: true, cwd: '<%= pkg.sourceFolder %>/', src: ['assets/fonts/*'], dest: '<%= pkg.distFolder %>/assets/fonts', filter: 'isFile', flatten: true},

                  // images 
                  {expand: true, cwd: '<%= pkg.sourceFolder %>/', src: ['assets/img/*'], dest: '<%= pkg.distFolder %>/assets/img', filter: 'isFile', flatten: true},   

                   // photos 
                  {expand: true, cwd: '<%= pkg.sourceFolder %>/', src: ['photos/*'], dest: '<%= pkg.distFolder %>/photos', filter: 'isFile', flatten: true},     

                   // photos 
                  {expand: true, cwd: '<%= pkg.sourceFolder %>/', src: ['photos/min/*'], dest: '<%= pkg.distFolder %>/photos/min', filter: 'isFile', flatten: true},     

                  // vendor js 
                  {expand: true, cwd: '<%= pkg.sourceFolder %>/', src: ['assets/js/vendor/**.js'], dest: '<%= pkg.distFolder %>/assets/js/vendor', flatten: true},

                  // stock html
                  {expand: true, cwd: '<%= pkg.sourceFolder %>/', src: ['*.*', '!*.md'], dest: '<%= pkg.distFolder %>/', filter: 'isFile'}
                 

                ]
            }

        },

        browserSync: {
            dev: {

                bsFiles: {
                    src : [
                        'src/*.html',
                        'src/css/*.css',
                        'src/js/*.js',
                        'src/photos/**.*'
                    ]
                },

                options: {
                    injectChanges: true,
                    watchTask: true,

                    watchOptions: {
                        ignoreInitial: true,
                        ignored: []
                    },

                    port: 80,
                    notify: false,
                    open: true,

                    server: {
                        baseDir: "src/",
                         directory: true
                    }
                }
            },

            dist: {


                options: {
                    port: 80,
                    notify: false,
                    server: {
                        baseDir: "dist/"
                    }
                }
            }
        },

        watch: {

            scripts: {
                files: ['src/assets/js/**'],
                tasks: ['defaultJS'],
                options: {
                    debounceDelay: 2000
                },
            },

            html: {
                files: ['src/*.md'],
                tasks: ['defaultHTML'],
                options: {
                    debounceDelay: 2000
                },
            },

            css: {
                files: ['src/assets/css/frag/**'],
                tasks: ['defaultCSS'],
                options: {
                    debounceDelay: 2000,
                    liveReload: true
                },      
            }

        }
    

    });

    grunt.registerTask('default', ['browserSync:dev', 'watch']);
    grunt.registerTask('defaultHTML', ['processhtml:dev']);
    grunt.registerTask('defaultCSS', ['less:dev']);
    grunt.registerTask('defaultJS', ['uglify:dev']);
    grunt.registerTask('defaultSVG', ['clean:svgbuild', 'svgmin:main', 'grunticon:main', 'clean:svgmain']);
    grunt.registerTask('dist', ['processhtml:dist', 'uglify:dist', 'concat:dist']);
   
};


