var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function run() {
  var cases = [];
  var TOKEN = 'shared-secret-token';

  cases.push({
    name: 'payload with known HN uses HN as patientId',
    fn: function () {
      var payload = core.buildRegistrationPayload({
        name: 'สมชาย ใจดี', phone: '0812345678', hn: 'HN12345', hnUnknown: false,
        yearOfBirth: 1955, sex: 'male', consent: true
      }, TOKEN);
      helpers.assertEqual(payload.patientId, 'HN12345');
      helpers.assertEqual(payload.hnUnknown, false);
      helpers.assertEqual(payload.token, TOKEN);
      var validation = core.validateRegistrationPayload(payload);
      helpers.assert(validation.valid, 'expected valid payload, got errors: ' + validation.errors.join(', '));
    }
  });

  cases.push({
    name: 'unknown HN falls back to a stable device UUID',
    fn: function () {
      var deviceUuid = core.generateDeviceUuid();
      helpers.assert(core.isValidUuid(deviceUuid), 'generated UUID should match UUIDv4 format');
      var payload = core.buildRegistrationPayload({
        name: 'สมหญิง รักดี', phone: '0898765432', hn: '', hnUnknown: true, deviceUuid: deviceUuid,
        yearOfBirth: 1948, sex: 'female', consent: true
      }, TOKEN);
      helpers.assertEqual(payload.patientId, deviceUuid);
      helpers.assertEqual(payload.hn, null);
      var validation = core.validateRegistrationPayload(payload);
      helpers.assert(validation.valid, 'expected valid payload for unknown-HN case');
    }
  });

  cases.push({
    name: 'missing consent is rejected',
    fn: function () {
      var payload = core.buildRegistrationPayload({
        name: 'ทดสอบ', phone: '0800000000', hn: 'HN999', consent: false
      }, TOKEN);
      var validation = core.validateRegistrationPayload(payload);
      helpers.assert(!validation.valid, 'payload without consent should be invalid');
      helpers.assert(validation.errors.indexOf('consent must be true') !== -1, 'expected consent error');
    }
  });

  cases.push({
    name: 'missing token is rejected',
    fn: function () {
      var payload = core.buildRegistrationPayload({ name: 'A', phone: '080', hn: 'HN1', consent: true }, '');
      var validation = core.validateRegistrationPayload(payload);
      helpers.assert(!validation.valid, 'payload without token should be invalid');
      helpers.assert(validation.errors.indexOf('missing token') !== -1, 'expected missing token error');
    }
  });

  cases.push({
    name: 'payload always carries current schema version',
    fn: function () {
      var payload = core.buildRegistrationPayload({ name: 'A', phone: '080', hn: 'HN1', consent: true }, TOKEN);
      helpers.assertEqual(payload.schemaVersion, core.SCHEMA_VERSION);
    }
  });

  return helpers.runSuite('t2_webhook_payload', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
