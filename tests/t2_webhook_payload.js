var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function run() {
  var cases = [];
  var TOKEN = 'shared-secret-token';
  var KEY = core.encodeDeviceKey(require('crypto').randomBytes(32));
  function evidence() {
    return { version: core.PDPA_NOTICE_VERSION, at: new Date().toISOString(), lang: 'th' };
  }

  cases.push({
    name: 'registration collects only HN, year of birth and sex',
    fn: function () {
      var payload = core.buildRegistrationPayload({
        hn: 'HN12345', yearOfBirth: 2498, sex: 'male', consent: evidence()
      }, TOKEN, KEY);
      helpers.assert(!('name' in payload), 'payload should not carry a name field');
      helpers.assert(!('phone' in payload), 'payload should not carry a phone field');
      helpers.assertEqual(payload.patientId, 'HN12345', 'the HN identifies the patient');
      helpers.assertEqual(payload.sex, 'male');
      helpers.assert(core.validateRegistrationPayload(payload).valid, 'expected a valid payload: ' + core.validateRegistrationPayload(payload).errors);
      helpers.assertEqual(Object.keys(payload).sort().join(','),
        'age,consent,consentAt,consentLang,consentVersion,deviceKey,hn,patientId,schemaVersion,sex,token,yearOfBirth');
    }
  });

  cases.push({
    name: 'a registration without an HN is rejected rather than given a stand-in id',
    fn: function () {
      var payload = core.buildRegistrationPayload({ yearOfBirth: 2495, sex: 'female', consent: evidence() }, TOKEN, KEY);
      helpers.assertEqual(payload.patientId, null);
      var validation = core.validateRegistrationPayload(payload);
      helpers.assert(!validation.valid, 'HN is required now');
      helpers.assert(validation.errors.indexOf('invalid patientId') !== -1, validation.errors.join());
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
      var noConsent = core.buildRegistrationPayload({ hn: 'HN1', yearOfBirth: 2493, sex: 'male', consent: false }, TOKEN, KEY);
      helpers.assert(core.validateRegistrationPayload(noConsent).errors.indexOf('missing consent') !== -1);

      // A ticked box with no record of which notice, when, or in what
      // language is not consent evidence.
      var bareConsent = core.buildRegistrationPayload({ hn: 'HN1', yearOfBirth: 2493, sex: 'male', consent: true }, TOKEN, KEY);
      var bare = core.validateRegistrationPayload(bareConsent).errors;
      helpers.assert(bare.indexOf('missing consent') !== -1 && bare.indexOf('invalid consentVersion') !== -1, bare.join());

      var noSex = core.buildRegistrationPayload({ hn: 'HN1', yearOfBirth: 2493, consent: evidence() }, TOKEN, KEY);
      helpers.assert(core.validateRegistrationPayload(noSex).errors.indexOf('missing sex') !== -1);

      var noYear = core.buildRegistrationPayload({ hn: 'HN1', sex: 'male', consent: evidence() }, TOKEN, KEY);
      helpers.assert(core.validateRegistrationPayload(noYear).errors.indexOf('missing yearOfBirth') !== -1);

      var noToken = core.buildRegistrationPayload({ hn: 'HN1', yearOfBirth: 2493, sex: 'male', consent: evidence() }, '', KEY);
      helpers.assert(core.validateRegistrationPayload(noToken).errors.indexOf('missing token') !== -1);

      var noKey = core.buildRegistrationPayload({ hn: 'HN1', yearOfBirth: 2493, sex: 'male', consent: evidence() }, TOKEN);
      helpers.assertEqual(core.validateRegistrationPayload(noKey).errors.join(), 'app update required');
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
    name: 'payload always carries the current protocol version',
    fn: function () {
      // PROTOCOL_VERSION is the upload format. SCHEMA_VERSION is the phone's
      // stored data, and changing it would discard every patient's history.
      var payload = core.buildRegistrationPayload({ hn: 'HN1', yearOfBirth: 2493, sex: 'male', consent: evidence() }, TOKEN, KEY);
      helpers.assertEqual(payload.schemaVersion, core.PROTOCOL_VERSION);
      helpers.assertEqual(core.SCHEMA_VERSION, 2, 'the stored-data version must not move with the upload format');
    }
  });

  cases.push({
    name: 'an HN typed with spaces or Thai digits is accepted as the same HN',
    fn: function () {
      helpers.assertEqual(core.normalizeHn(' 44 05 123 '), '4405123');
      helpers.assertEqual(core.normalizeHn('\u0e54\u0e54\u0e50\u0e55\u0e51\u0e52\u0e53'), '4405123');
      helpers.assertEqual(core.normalizeHn('\u0e50\u0e50\u0e51 \u0e52\u0e53\u0e54\u0e55'), '0012345', 'leading zeros are kept');
      helpers.assertEqual(core.normalizeHn('AB/12-34'), 'AB/12-34', 'an HN already valid is unchanged');
      helpers.assert(!core.isValidHn(core.normalizeHn('=1+1')), 'a formula is still refused');
    }
  });

  return helpers.runSuite('t2_webhook_payload', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
