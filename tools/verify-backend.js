#!/usr/bin/env node
/*
 * Checks what the deployed Apps Script actually does, after a redeploy.
 *
 *   node tools/verify-backend.js <the /exec URL>            read-only probes
 *   node tools/verify-backend.js <the /exec URL> --write    also a full round trip
 *
 * The read-only probes send requests the script must refuse, so they write
 * nothing to the sheet; if the deployed version is not this one they stop
 * after the first check, because an older script would accept them. --write registers two made-up patients (HNs starting
 * ZZTEST-) and prints the rows to delete afterwards. Needs Node 18 or later.
 * Exit code 0 only if every probe passes.
 */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var GS = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8');
var EXPECTED_VERSION = GS.match(/SCRIPT_VERSION = '([^']+)'/)[1];
var TOKEN = GS.match(/SHARED_TOKEN = '([^']+)'/)[1];
var PROTOCOL = Number(GS.match(/PROTOCOL_VERSION = (\d+)/)[1]);
var CONSENT = GS.match(/CONSENT_VERSIONS = \[[^\]]*'([^']+)'\]/)[1];

function key() {
  return crypto.randomBytes(32).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function today() { return new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10); }
function record(hn, deviceKey, fields) {
  return Object.assign({ token: TOKEN, schemaVersion: PROTOCOL, patientId: hn, deviceKey: deviceKey, date: today() }, fields);
}
function registration(hn, deviceKey) {
  var year = new Date().getUTCFullYear();
  return { token: TOKEN, schemaVersion: PROTOCOL, patientId: hn, hn: hn, yearOfBirth: 1950, age: year - 1950, sex: 'female',
    consent: true, consentVersion: CONSENT, consentAt: new Date().toISOString(), consentLang: 'en', deviceKey: deviceKey };
}

/** Runs the probes through transport {get(), post(bodyText)} → parsed JSON. Returns [{name, ok, detail}]. */
async function probe(transport, options) {
  options = options || {};
  var results = [];
  async function expect(name, fn) {
    try {
      var detail = await fn();
      results.push({ name: name, ok: true, detail: detail || '' });
    } catch (e) {
      results.push({ name: name, ok: false, detail: e.message });
    }
  }
  function refusedWith(reply, reason) {
    if (reply.ok !== false || reply.error !== reason) throw new Error('expected refusal "' + reason + '", got ' + JSON.stringify(reply));
    return reason;
  }
  var probeHn = 'ZZTEST-PROBE';

  await expect('the deployed script is this version', async function () {
    var r = await transport.get();
    if (r.version !== EXPECTED_VERSION || r.protocol !== PROTOCOL) {
      throw new Error('deployed ' + r.version + ' (protocol ' + r.protocol + '), expected ' + EXPECTED_VERSION +
        ' (protocol ' + PROTOCOL + '). Deploy > Manage deployments > New version, then run this again.');
    }
    return r.version;
  });
  if (!results[0].ok) {
    // An older script accepts what these probes send, so they would write
    // rows to the live sheet. Stop until the new version is deployed.
    results.push({ name: 'remaining probes skipped', ok: false, detail: 'run again after deploying ' + EXPECTED_VERSION });
    return results;
  }
  await expect('a registration of only token and HN is refused', async function () {
    return refusedWith(await transport.post(JSON.stringify({ token: TOKEN, patientId: probeHn })), 'app update required');
  });
  await expect('a registration without consent evidence is refused', async function () {
    var r = registration(probeHn, key());
    delete r.consentVersion;
    return refusedWith(await transport.post(JSON.stringify(r)), 'invalid consentVersion');
  });
  await expect('a registration with an impossible birth year is refused', async function () {
    var r = registration(probeHn, key());
    r.yearOfBirth = 2020; r.age = new Date().getUTCFullYear() - 2020;
    return refusedWith(await transport.post(JSON.stringify(r)), 'invalid yearOfBirth');
  });
  await expect('a height of 999 cm is refused', async function () {
    return refusedWith(await transport.post(JSON.stringify(record(probeHn, key(), { type: 'checkin', heightCm: 999 }))), 'invalid heightCm');
  });
  await expect('a date that does not exist is refused', async function () {
    return refusedWith(await transport.post(JSON.stringify(record(probeHn, key(), { type: 'checkin', heightCm: 160, date: '2026-02-30' }))), 'invalid date');
  });
  await expect('a valid record from a phone not registered for that HN is refused', async function () {
    return refusedWith(await transport.post(JSON.stringify(record(probeHn, key(), { type: 'checkin', heightCm: 160 }))),
      'device not registered for this patient');
  });
  await expect('a formula as an HN is refused', async function () {
    return refusedWith(await transport.post(JSON.stringify(record('=1+1', key(), { type: 'falls', injured: 0 }))), 'invalid patientId');
  });
  await expect('an oversized request is refused', async function () {
    return refusedWith(await transport.post('{"token":"' + TOKEN + '","pad":"' + new Array(21000).join('a') + '"}'), 'request too large');
  });

  if (options.write) {
    var suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    var hnA = 'ZZTEST-A' + suffix;
    var hnB = 'ZZTEST-B' + suffix;
    var keyA = key();
    var keyB = key();
    await expect('two made-up patients register', async function () {
      var a = await transport.post(JSON.stringify(registration(hnA, keyA)));
      var b = await transport.post(JSON.stringify(registration(hnB, keyB)));
      if (!a.ok || !b.ok) throw new Error(JSON.stringify([a, b]));
      return hnA + ', ' + hnB;
    });
    await expect("patient A's phone cannot write to patient B", async function () {
      await transport.post(JSON.stringify(record(hnB, keyB, { type: 'checkin', heightCm: 160 })));
      return refusedWith(await transport.post(JSON.stringify(record(hnB, keyA, { type: 'checkin', heightCm: 170 }))),
        'device not registered for this patient');
    });
    await expect("patient A's phone cannot claim patient B's HN", async function () {
      return refusedWith(await transport.post(JSON.stringify(registration(hnB, keyA))), 'hn registered on another device');
    });
    await expect("a correction from B's own phone is a new version", async function () {
      var r = await transport.post(JSON.stringify(record(hnB, keyB, { type: 'checkin', heightCm: 158 })));
      if (!r.ok || !r.result || r.result.action !== 'corrected' || r.result.version !== 2) throw new Error(JSON.stringify(r));
      return 'version ' + r.result.version + ', receipt ' + r.result.receiptId;
    });
    results.cleanup = 'Delete the rows for ' + hnA + ' and ' + hnB + ' from Devices, Registrations, CheckIns and Audit, and the ' +
      'pending Devices row for ' + hnB + '.';
  }
  return results;
}

function fetchTransport(url) {
  return {
    get: async function () { return (await fetch(url, { redirect: 'follow' })).json(); },
    post: async function (body) {
      var res = await fetch(url, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body });
      var text = await res.text();
      try { return JSON.parse(text); } catch (e) { throw new Error('not JSON (HTTP ' + res.status + '): ' + text.slice(0, 120)); }
    }
  };
}

module.exports = { probe: probe, EXPECTED_VERSION: EXPECTED_VERSION };

if (require.main === module) {
  var url = process.argv[2];
  if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(url || '')) {
    console.error('Usage: node tools/verify-backend.js https://script.google.com/macros/s/…/exec [--write]');
    process.exit(2);
  }
  var options = { write: process.argv.indexOf('--write') !== -1 };
  probe(fetchTransport(url), options).then(function (results) {
    results.forEach(function (r) { console.log((r.ok ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? ' — ' + r.detail : '')); });
    if (results.cleanup) console.log('\n' + results.cleanup);
    var failed = results.filter(function (r) { return !r.ok; }).length;
    console.log(failed ? '\n' + failed + ' probe(s) failed: the backend is NOT fixed yet.'
      : options.write ? '\nAll probes passed, the round trip included.'
      : '\nAll read-only probes passed. They never reach the code that accepts a record: run once more with --write to prove that.');
    process.exitCode = failed ? 1 : 0;
  }, function (e) { console.error(e); process.exitCode = 1; });
}
