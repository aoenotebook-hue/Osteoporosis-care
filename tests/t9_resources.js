var path = require('path');
var core = require(path.join(__dirname, '..', 'app-core.js'));
var helpers = require('./helpers');

function containsUrlLike(str) {
  return /https?:\/\//i.test(str) || /\.[a-z]{2,3}\//i.test(str);
}

function run() {
  var cases = [];

  cases.push({
    name: 'there are 4-6 resource links as the plan specifies',
    fn: function () {
      helpers.assert(core.RESOURCE_LINKS.length >= 4 && core.RESOURCE_LINKS.length <= 6, 'expected 4-6 resource links, found ' + core.RESOURCE_LINKS.length);
    }
  });

  cases.push({
    name: 'every resource link has a real url field (used only for the href, never rendered as text)',
    fn: function () {
      core.RESOURCE_LINKS.forEach(function (link) {
        helpers.assert(typeof link.url === 'string' && /^https?:\/\//.test(link.url), link.id + ' should carry a real url for the href');
      });
    }
  });

  cases.push({
    name: 'rendered resource cards expose only title + description text, never the raw url string',
    fn: function () {
      ['th', 'en'].forEach(function (lang) {
        core.RESOURCE_LINKS.forEach(function (link) {
          var card = core.renderResourceCard(link, lang);
          helpers.assert(!('url' in card), 'rendered card for ' + link.id + ' must not carry a url field');
          helpers.assert(card.title && card.title.length > 0, link.id + ' missing rendered title for ' + lang);
          helpers.assert(card.description && card.description.length > 0, link.id + ' missing rendered description for ' + lang);
          helpers.assert(!containsUrlLike(card.title), link.id + ' title looks like it contains a URL');
          helpers.assert(!containsUrlLike(card.description), link.id + ' description looks like it contains a URL');
        });
      });
    }
  });

  cases.push({
    name: 'the four learn-panel topics required by the plan all have TH/EN content',
    fn: function () {
      ['learnWhatIsTitle', 'learnMedMattersTitle', 'learnTScoreTitle', 'learnExpectTitle'].forEach(function (key) {
        helpers.assert(core.CONTENT[key] && core.CONTENT[key].th && core.CONTENT[key].en, 'missing learn panel content for ' + key);
      });
    }
  });

  return helpers.runSuite('t9_resources', cases);
}

module.exports = run;

if (require.main === module) {
  helpers.report(run());
}
