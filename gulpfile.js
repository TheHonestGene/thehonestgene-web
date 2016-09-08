/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

'use strict';

const path = require('path');
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const nodeGlobals = require('rollup-plugin-node-globals');

// Got problems? Try logging 'em
//const logging = require('plylog');
//logging.setVerbose();

// !!! IMPORTANT !!! //
// Keep the global.config above any of the gulp-tasks that depend on it
global.config = {
  polymerJsonPath: path.join(process.cwd(), 'polymer.json'),
  build: {
    rootDirectory: 'build',
    bundledDirectory: 'bundled',
    unbundledDirectory: 'unbundled',
    // Accepts either 'bundled', 'unbundled', or 'both'
    // A bundled version will be vulcanized and sharded. An unbundled version
    // will not have its files combined (this is for projects using HTTP/2
    // server push). Using the 'both' option will create two output projects,
    // one for bundled and one for unbundled
    bundleType: 'both'
  },
  // Path to your service worker, relative to the build root directory
  serviceWorkerPath: 'service-worker.js',
  // Service Worker precache options based on
  // https://github.com/GoogleChrome/sw-precache#options-parameter
  swPrecacheConfig: {
    navigateFallback: '/index.html'
  }
};

gulp.task('script', function () {
  return rollup.rollup({
    entry: 'scripts/thg.js',
    plugins: [
      nodeResolve({jsnext: true, main: true, browser:true}),
      commonjs({
        //
        include: 'node_modules/**',
        exclude: [
          './node_modules/process-es6/browser.js',
          './node_modules/rollup-plugin-node-globals/src/global.js',
          './node_modules/symbol-observable/es/index.js'
        ]
      }),
      babel({exclude: 'node_modules/**'}),
      nodeGlobals()
    ]
  }).then(function (bundle) {
    return bundle.write({
      format: 'iife',
      moduleName: 'THG',
      moduleId: 'THG',
      dest: 'src/scripts/thg.js'
    });
  });
});

// Add your own custom gulp tasks to the gulp-tasks directory
// A few sample tasks are provided for you
// A task should return either a WriteableStream or a Promise
const clean = require('./gulp-tasks/clean.js');
const images = require('./gulp-tasks/images.js');
const project = require('./gulp-tasks/project.js');

// The source task will split all of your source files ivar sourcemaps = require("gulp-sourcemaps");
// big ReadableStream. Source files are those in src/** as well as anything
// added to the sourceGlobs property of polymer.json.
// Because most HTML Imports contain inline CSS and JS, those inline resources
// will be split out into temporary files. You can use gulpif to filter files
// out of the stream and run them through specific tasks. An example is provided
// which filters all images and runs them through imagemin
function source() {
  return project.splitSource()
    // Add your own build tasks here!
    //.pipe($.if('**/*.js',$.sourcemaps.init({identityMap:true})))
    .pipe($.if(['**/*.js','!src/scripts/**'],$.babel()))
    //.pipe($.if('**/*.js',$.sourcemaps.write('.')))
    .pipe($.if('**/*.{png,gif,jpg,svg}', images.minify()))
    .pipe(project.rejoin()); // Call rejoin when you're finished
}

// The dependencies task will split all of your bower_components files into one
// big ReadableStream
// You probably don't need to do anything to your dependencies but it's here in
// case you need it :)
function dependencies() {
  return project.splitDependencies()
    .pipe(project.rejoin());
}

// Clean the build directory, split all source and dependency files into streams
// and process them, and output bundled and unbundled versions of the project
// with their own service workers
gulp.task('default', gulp.series([
  'script',
  clean.build,
  project.merge(source, dependencies),
  project.serviceWorker
]));

// Create a build for development

function onlyUnbundled(done) {
  config.build.bundleType = 'unbundled';
  done()
}
gulp.task('dev',gulp.series(
      'script',
      onlyUnbundled,
      clean.build,
      project.merge(source, dependencies)
  ));


// Start development server
const proxyMiddleware = require('http-proxy-middleware');
const browserSync = require('browser-sync').create();
function reload() {
  //browserSync.reload();
  //done();
  console.log('reload');
 }


/**
 * Context matching: decide which path(s) should be proxied. (wildcards supported)
 **/
const context = ['/api','/stomp'];
/**
 * Proxy options
 */
const options = {
  // hostname to the target server
  target: 'http://localhost:8000/',
  pathRewrite: {'^/api':''},

  // set correct host headers for name-based virtual hosted sites
  changeOrigin: true,

  // enable websocket proxying
  ws: true,
  // re-target based on the request's host header and/or path
  proxyTable: {
    '/stomp': 'http://localhost:15674/',  // for STOMP calls
    '/api': 'http://localhost:8000/'   // for REST caLLS
  },
  // control logging
  logLevel: 'silent',
};
/**
 * Create the proxy middleware, so it can be used in a server.
 */
const proxy = proxyMiddleware(context, options);

gulp.task('watch',gulp.series('default',function() {
  const watcher = gulp.watch('src/**/*.html');
  watcher.on('all',gulp.series(['default']));
}));

// Watch files for changes & reload
gulp.task('serve', gulp.series('dev', function() {
  browserSync.init({
    port: 5000,
    server: {
      baseDir: ['build/unbundled'],
      middleware: [proxy],
    }
  });



  const watcher = gulp.watch(['src/**/*.html','series/**/*.js','images/**/*']);
  //watcher.on('all',gulp.series(['dev',reload]));
  //gulp.watch(['scripts/**/*.js'], gulp.series('dev', reload));
  //gulp.watch(['images/**/*'], gulp.series('dev',reload));
}));