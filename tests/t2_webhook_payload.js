var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function run() {
  var cases = [];
  var TOKEN = 'shared-secret-token';

  cases.push({
    name: 'registration collects only HN, year of birth and sex',
    fn: function () {
      var payload = core.buildRegistrationPayload({
        hn: 'HN12345', yearOfBirth: 2498, sex: 'male', consent: true
      }, TOKEN);
      helpers.assert(!('name' in payload), 'payload should not carry a name field');
      helpers.assert(!('phone' in payload), 'payload should not carry a phone field');
      helpers.assertEqual(payload.patientId, 'HN12345', 'the HN identifies the patient');
      helpers.assertEqual(payload.sex, 'male');
      helpers.assert(core.validateRegistrationPayload(payload).valid, 'expected a valid payload');
    }
  });

  cases.push({
    name: 'a registration without an HN is rejected rather than given a stand-in id',
    fn: function () {
      var payload = core.buildRegistrationPayload({ yearOfBirth: 2495, sex: 'female', consent: true }, TOKEN);
      helpers.assertEqual(payload.patientId, null);
      var validation = core.validateRegistrationPayload(payload);
      helpers.assert(!validation.valid, 'HN is required now');
      helpers.assert(validation.errors.indexOf('missing HN') !== -1);
    }
  });

  cases.push({
    name: 'a Buddhist-era year of birth is converted to CE and an age derived',
    fn: function () {
      var payload = core.buildRegistrationPayload({ hn: 'HN1', yearOfBirth: 2495, sex: 'female', consent: true }, TOKEN);
      helpers.assertEqual(payload.yearOfBirth, 1952);
      helpers.assertEqual(payload.age, new Date().getFullYear() - 1952);
    }
  });

  cases.push({
    name: 'a Gregorian year of birth is kept as-is',
    fn: function () {
      var payload = core.buildRegistrationPayload({ hn: 'HN1', yearOfBirth: 1952, sex: 'male', consent: true }, TOKEN);
      helpers.assertEqual(payload.yearOfBirth, 1952);
    }
  });

  cases.push({
    name: 'missing consent, sex, year of birth or token are each rejected',
    fn: function () {
      var noConsent = core.buildRegistrationPayload({ hn: 'HN1', yearOfBirth: 2493, sex: 'male', consent: false }, TOKEN);
      helpers.assert(core.validateRegistrationPayload(noConsent).errors.indexOf('consent must be true') !== -1);

      var noSex = core.buildRegistrationPayload({ hn: 'HN1', yearOfBirth: 2493, consent: true }, TOKEN);
      helpers.assert(core.validateRegistrationPayload(noSex).errors.indexOf('missing sex') !== -1);

      var noYear = core.buildRegistrationPayload({ hn: 'HN1', sex: 'male', consent: true }, TOKEN);
      helpers.assert(core.validateRegistrationPayload(noYear).errors.indexOf('missing yearOfBirth') !== -1);

      var noToken = core.buildRegistrationPayload({ hn: 'HN1', yearOfBirth: 2493, sex: 'male', consent: true }, '');
      helpers.assert(core.validateRegistrationPayload(noToken).errors.indexOf('missing token') !== -1);
    }
  });

  cases.push({
    name: 'an implausible birth year yields no age rather than a nonsense one',
    fn: function () {
      helpers.assertEqual(core.deriveAge(1750), null);
      helpers.assertEqual(core.deriveAge('not a year'), null);
      helpers.assertEqual(core.deriveAge(new Date().getFullYear() + 5), null);
    }
  });

  cases.push({
    name: 'payload always carries the current schema version',
    fn: function () {
      var payload = core.buildRegistrationPayload({ hn: 'HN1', yearOfBirth: 2493, sex: 'male', consent: true }, TOKEN);
      helpers.assertEqual(payload.schemaVersion, core.SCHEMA_VERSION);
    }
  });

  return helpers.runSuite('t2_webhook_payload', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
