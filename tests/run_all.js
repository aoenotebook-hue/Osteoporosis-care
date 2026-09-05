var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

var files = fs.readdirSync(__dirname)
  .filter(function (f) { return /^t\d+_.*\.js$/.test(f); })
  .sort();

var allPassed = true;

files.forEach(function (file) {
  var run = require(path.join(__dirname, file));
  var result = run();
  helpers.report(result);
  if (!result.passed) allPassed = false;
});

console.log(allPassed ? '\nAll test suites passed.' : '\nSome test suites failed.');
process.exitCode = allPassed ? 0 : 1;
