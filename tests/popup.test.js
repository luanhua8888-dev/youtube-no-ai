const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const source = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const tick = () => new Promise(resolve => setTimeout(resolve, 40));

test('popup đọc số video từ tab hiện tại và lưu tùy chọn lọc truyện', async () => {
  const dom = new JSDOM(source('popup.html'), { runScripts: 'outside-only' });
  let settings;
  const messages = [];
  dom.window.chrome = {
    storage: { local: {
      get: async () => ({ settings: { keywords: ['example'] } }),
      set: async value => { settings = value.settings; }
    } },
    tabs: {
      query: async query => { assert.deepEqual(JSON.parse(JSON.stringify(query)), { active: true, currentWindow: true }); return [{ id: 23 }]; },
      sendMessage: async (id, message) => { messages.push([id, message.type]); return { hidden: 7 }; }
    }
  };
  try {
    dom.window.eval(source('filter.js'));
    dom.window.eval(source('popup.js'));
    await tick();
    const document = dom.window.document;
    assert.equal(document.getElementById('blocked-count').textContent, '7');
    assert.deepEqual(messages, [[23, 'noai-status']]);
    assert.equal(document.getElementById('filterStories').checked, true);
    assert.equal(document.getElementById('filterVietsubChannels').checked, true);
    document.getElementById('filterVietsubChannels').checked = false;
    document.getElementById('filterStories').checked = false;
    document.getElementById('settings-form').dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
    await tick();
    assert.equal(settings.filterStories, false);
    assert.equal(settings.filterVietsubChannels, false);
    assert.deepEqual(Array.from(settings.keywords), ['example']);
  } finally { dom.window.close(); }
});

test('popup không báo số 0 khi tab không có content script', async () => {
  const dom = new JSDOM(source('popup.html'), { runScripts: 'outside-only' });
  dom.window.chrome = {
    storage: { local: { get: async () => ({}) } },
    tabs: { query: async () => [{ id: 1 }], sendMessage: async () => { throw new Error('No receiver'); } }
  };
  try {
    dom.window.eval(source('filter.js'));
    dom.window.eval(source('popup.js'));
    await tick();
    assert.equal(dom.window.document.getElementById('blocked-count').textContent, '—');
    assert.match(dom.window.document.getElementById('count-label').textContent, /Mở tab YouTube/);
  } finally { dom.window.close(); }
});
