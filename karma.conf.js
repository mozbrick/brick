module.exports = function(config){
  config.set({
    basePath: '.',

    files : [
      'bower_components/platform/platform.js',
      'test/smoke.js',
      'dist/brick.min.html',
      {pattern: 'dist/**/*', watched: true, included: false, served: true}
    ],

    autoWatch : true,

    frameworks: ['mocha', 'chai', 'chai-as-promised'],

    browsers : ['Firefox'],

    plugins : [
      'karma-firefox-launcher',
      'karma-mocha',
      'karma-chai',
      'karma-chai-plugins',
    ],
  });
};
