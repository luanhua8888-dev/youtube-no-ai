const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const source = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const tick = () => new Promise(resolve => setTimeout(resolve, 200));
async function setup(html, fetchImpl) {
  const dom = new JSDOM(html, { url: 'https://www.youtube.com/', runScripts: 'outside-only' });
  const listeners = [];
  let messageHandler;
  dom.window.readFilterStatus = () => new Promise(resolve => messageHandler({ type: 'noai-status' }, {}, resolve));
  if (fetchImpl) dom.window.fetch = fetchImpl;
  let settings = {};
  dom.window.chrome = {
    storage: {
      local: {
        get: async () => ({ settings }),
        set: async value => {
          settings = value.settings;
          listeners.forEach(listener => listener({ settings: { newValue: settings } }, 'local'));
        }
      },
      onChanged: { addListener: listener => listeners.push(listener) }
    },
    runtime: { onMessage: { addListener(listener) { messageHandler = listener; } } }
  };
  dom.window.eval(source('filter.js'));
  dom.window.eval(source('disclosure.js'));
  dom.window.eval(source('content.js'));
  await tick();
  return dom;
}
const card = (id, title) => `<ytd-rich-item-renderer id="${id}"><yt-lockup-view-model><a id="video-title" href="/watch?v=${id}">${title}</a><ytd-channel-name><a href="/@maker">Maker</a></ytd-channel-name></yt-lockup-view-model></ytd-rich-item-renderer>`;

test('lọc một lần với thẻ lồng nhau, hiện lại, điều hướng và cho phép kênh', async () => {
  const dom = await setup(card('ai', 'ChatGPT tips') + card('normal', 'Travel Thailand'));
  try {
    const document = dom.window.document;
    assert.equal(document.querySelectorAll('.yt-noai-hidden').length, 1);
    assert.equal(document.querySelectorAll('.yt-noai-placeholder').length, 1);
    document.querySelector('.yt-noai-placeholder button').click();
    await tick();
    assert.equal(document.querySelectorAll('.yt-noai-hidden').length, 0);
    dom.window.history.pushState({}, '', '/results?search_query=test');
    document.dispatchEvent(new dom.window.Event('yt-navigate-finish'));
    await tick();
    assert.equal(document.querySelectorAll('.yt-noai-hidden').length, 1);
    document.querySelectorAll('.yt-noai-placeholder button')[1].click();
    await tick();
    assert.equal(document.querySelectorAll('.yt-noai-hidden').length, 0);
    assert.equal((await dom.window.chrome.storage.local.get()).settings.allowedChannels[0], '/@maker');
  } finally { dom.window.close(); }
});
test('thẻ thêm mới, thay đổi tiêu đề, chế độ compact và tắt lọc', async () => {
  const dom = await setup(card('normal', 'Travel Thailand'));
  try {
    const document = dom.window.document;
    document.body.insertAdjacentHTML('beforeend', card('added', 'AI movie'));
    await tick();
    assert.ok(document.getElementById('added').classList.contains('yt-noai-hidden'));
    document.querySelector('#added #video-title').firstChild.data = 'Cooking tutorial';
    await tick();
    assert.equal(document.querySelectorAll('.yt-noai-hidden').length, 0);
    document.querySelector('#added #video-title').firstChild.data = 'AI movie';
    await dom.window.chrome.storage.local.set({ settings: { compact: true } });
    await tick();
    assert.equal(document.querySelectorAll('.yt-noai-hidden').length, 1);
    assert.equal(document.querySelectorAll('.yt-noai-placeholder').length, 0);
    await dom.window.chrome.storage.local.set({ settings: { enabled: false } });
    await tick();
    assert.equal(document.querySelectorAll('.yt-noai-hidden').length, 0);
  } finally { dom.window.close(); }
});
test('thẻ được xóa sẽ xóa ô thay thế', async () => {
  const dom = await setup(card('removed', 'AI cover'));
  try {
    dom.window.document.getElementById('removed').remove();
    await tick();
    assert.equal(dom.window.document.querySelectorAll('.yt-noai-placeholder').length, 0);
  } finally { dom.window.close(); }
});
test('nhãn AI trên thẻ không cần tiêu đề AI và nhãn thêm muộn được lọc', async () => {
  const dom = await setup(card('label', 'Sạp Mì Thời Minh'));
  try {
    const document = dom.window.document;
    assert.equal(document.querySelectorAll('.yt-noai-hidden').length, 0);
    const badge = document.createElement('ytd-badge-supported-renderer');
    badge.setAttribute('aria-label', 'AI: Content was made with AI');
    document.getElementById('label').append(badge);
    await tick();
    assert.equal(document.querySelectorAll('.yt-noai-hidden').length, 1);
    assert.match(document.querySelector('.yt-noai-placeholder').textContent, /YouTube đánh dấu/);
  } finally { dom.window.close(); }
});
test('kiểm tra trang video, lưu tạm kết quả và khôi phục khi tắt kiểm tra', async () => {
  const fixture = require('./fixtures/ai-disclosure.json');
  const calls = [];
  const dom = await setup(card('RradgG3cUrE', 'Sạp Mì Thời Minh'), async (url, options) => {
    calls.push({ url, options });
    return { ok: true, text: async () => `<script>var ytInitialData = ${JSON.stringify(fixture)};</script>` };
  });
  try {
    await tick();
    const document = dom.window.document;
    assert.equal(document.querySelectorAll('.yt-noai-hidden').length, 1);
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /RradgG3cUrE/);
    assert.equal(calls[0].options.credentials, 'omit');
    await dom.window.chrome.storage.local.set({ settings: { checkLabels: false } });
    await tick();
    assert.equal(document.querySelectorAll('.yt-noai-hidden').length, 0);
    await dom.window.chrome.storage.local.set({ settings: { checkLabels: true } });
    await tick();
    assert.equal(document.querySelectorAll('.yt-noai-hidden').length, 1);
    assert.equal(calls.length, 1);
  } finally { dom.window.close(); }
});
test('không chặn video khi trang trả về lỗi hoặc thiếu thông tin nhãn', async () => {
  const dom = await setup(card('RradgG3cUrE', 'Sạp Mì Thời Minh'), async () => ({ ok: true, text: async () => '<html>Consent required</html>' }));
  try {
    await tick();
    assert.equal(dom.window.document.querySelectorAll('.yt-noai-hidden').length, 0);
  } finally { dom.window.close(); }
});
test('đếm thẻ bị chặn trên trang và cập nhật khi hiện lại, thêm/xóa thẻ, tắt lọc', async () => {
  const dom = await setup(card('story', 'Xuyên Về Thời Minh Chỉ Có Sạp Mì Rách, Anh Từng Bước Khiến Cả Phố Nể Phục') + card('ai', 'AI movie') + card('normal', 'Nấu mì ngon'));
  try {
    const document = dom.window.document;
    assert.equal((await dom.window.readFilterStatus()).hidden, 2);
    document.querySelector('.yt-noai-placeholder button').click();
    assert.equal((await dom.window.readFilterStatus()).hidden, 1);
    document.body.insertAdjacentHTML('beforeend', card('added', 'Trọng Sinh Về Tuổi 19'));
    assert.equal((await dom.window.readFilterStatus()).hidden, 2);
    document.getElementById('added').remove();
    assert.equal((await dom.window.readFilterStatus()).hidden, 1);
    await dom.window.chrome.storage.local.set({ settings: { enabled: false } });
    assert.equal((await dom.window.readFilterStatus()).hidden, 0);
  } finally { dom.window.close(); }
});
test('lọc kênh Vietsub và cập nhật số đếm khi tắt tùy chọn', async () => {
  const dom = await setup(card('vietsub', 'Một ngày bình thường').replace('>Maker<', '>Phim VIETSUB<') + card('normal', 'Bản Vietsub'));
  try {
    assert.equal((await dom.window.readFilterStatus()).hidden, 1);
    assert.ok(dom.window.document.getElementById('vietsub').classList.contains('yt-noai-hidden'));
    assert.match(dom.window.document.querySelector('.yt-noai-placeholder').textContent, /Vietsub/);
    await dom.window.chrome.storage.local.set({ settings: { filterVietsubChannels: false } });
    assert.equal((await dom.window.readFilterStatus()).hidden, 0);
  } finally { dom.window.close(); }
});
