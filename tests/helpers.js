function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error((msg || 'Values not equal') + ' — expected ' + JSON.stringify(expected) + ' got ' + JSON.stringify(actual));
  }
}

function runSuite(suiteName, cases) {
  var failures = [];
  cases.forEach(function (c) {
    try {
      c.fn();
    } catch (e) {
      failures.push({ name: c.name, error: e.message });
    }
  });
  return { suiteName: suiteName, total: cases.length, failures: failures, passed: failures.length === 0 };
}

function report(result) {
  if (result.passed) {
    console.log('PASS ' + result.suiteName + ' (' + result.total + ' cases)');
  } else {
    console.log('FAIL ' + result.suiteName + ' (' + result.failures.length + '/' + result.total + ' failed)');
    result.failures.forEach(function (f) {
      console.log('  - ' + f.name + ': ' + f.error);
    });
  }
  process.exitCode = result.passed ? (process.exitCode || 0) : 1;
}

module.exports = { assert: assert, assertEqual: assertEqual, runSuite: runSuite, report: report };
