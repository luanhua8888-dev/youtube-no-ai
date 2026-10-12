const test = require('node:test');
const assert = require('node:assert/strict');
const { classify, includesTerm, cleanSettings } = require('../filter');

test('lọc cả nội dung AI và video nói về AI theo mặc định', () => {
  for (const title of ['AI generated movie', 'Học ChatGPT cơ bản', 'Trí tuệ nhân tạo là gì?', 'Nhạc AI mới']) {
    assert.ok(classify({ title }), title);
  }
});
test('không khớp AI nằm trong một từ khác', () => {
  for (const title of ['Thailand travel', 'Minecraft survival', 'Airtel news', 'Bài hát tuổi thơ']) {
    assert.equal(classify({ title }), null, title);
  }
  assert.equal(includesTerm('New #AI: music', 'ai'), true);
});
test('chế độ generated giữ video hướng dẫn nhưng lọc cụm chỉ dấu', () => {
  assert.equal(classify({ title: 'Hướng dẫn ChatGPT' }, { mode: 'generated' }), null);
  assert.ok(classify({ title: 'Bài hát được tạo bằng AI' }, { mode: 'generated' }));
});
test('danh sách cho phép ưu tiên, chặn khớp chính xác', () => {
  const video = { title: 'AI cover', channel: { name: 'Music', handle: '@music', path: '/@music' } };
  assert.equal(classify(video, { allowedChannels: ['/@music'], blockedChannels: ['Music'] }), null);
  assert.equal(classify({ title: 'Song', channel: video.channel }, { blockedChannels: ['@music'] }).type, 'channel');
  assert.equal(classify({ title: 'Song', channel: video.channel }, { blockedChannels: ['Mus'] }), null);
});
test('từ khóa tùy chỉnh và tắt lọc', () => {
  assert.ok(classify({ title: 'Tổng hợp hoạt hình' }, { keywords: ['hoạt hình'] }));
  assert.equal(classify({ title: 'AI cover' }, { enabled: false }), null);
  assert.deepEqual(cleanSettings({ keywords: [' AI ', '', 'AI', 5] }).keywords, ['AI']);
});
test('nhãn AI lọc tiêu đề không có từ AI kể cả kênh được cho phép', () => {
  const video = {
    title: 'Trọng Sinh Về Tuổi 19, Anh Không Để Nàng Câm Lấy Chồng Vũ Phu, Quyết Săn Thú Dựng Nhà Cưới Nàng',
    channel: { name: 'Maker' }, aiLabel: true
  };
  assert.equal(classify(video, { mode: 'generated', allowedChannels: ['Maker'] }).type, 'label');
  assert.equal(classify(video, { enabled: false }), null);
  assert.equal(classify({ ...video, aiLabel: false }, { filterStories: false }), null);
});
test('lọc cả hai ví dụ truyện của người dùng mà không cần nhãn AI', () => {
  for (const title of [
    'Xuyên Về Thời Minh Chỉ Có Sạp Mì Rách, Anh Từng Bước Khiến Cả Phố Nể Phục',
    'Trọng Sinh Về Tuổi 19, Anh Không Để Nàng Câm Lấy Chồng Vũ Phu',
    'XUYÊN KHÔNG về cổ đại', 'Xuyên Đến Thời Đường', 'Tai sinh thanh phu ho'
  ]) {
    assert.equal(classify({ title }).type, 'story', title);
    assert.equal(classify({ title }, { filterStories: false }), null, title);
  }
});
test('lọc truyện chỉ đọc tiêu đề, có thể cho phép kênh và giữ video thông thường', () => {
  assert.equal(classify({ title: 'Nấu mì ngon', channel: { name: 'Xuyên Không' } }), null);
  assert.equal(classify({ title: 'Xuyên Về Thời Minh', channel: { name: 'Maker' } }, { allowedChannels: ['Maker'] }), null);
  assert.equal(classify({ title: 'Lịch sử nhà Minh và nghề bán mì' }), null);
});
test('chặn kênh có Vietsub trong tên hoặc handle, gồm biến thể và chữ ghép', () => {
  for (const name of ['Phim Vietsub', 'VIETSUB TV', 'Viet Sub Official', 'Nhạc Viet-sub', 'Viet_sub', 'Viet.sub', 'PhimVietsubHay']) {
    assert.equal(classify({ title: 'Một ngày bình thường', channel: { name } }).type, 'channel', name);
  }
  assert.equal(classify({ title: 'Một ngày bình thường', channel: { name: 'Phim Hay', handle: '@phimvietsub' } }).type, 'channel');
});
test('chỉ xét kênh cho Vietsub; tắt tùy chọn hoặc cho phép kênh sẽ giữ video', () => {
  const video = { title: 'Một ngày bình thường', channel: { name: 'Phim Vietsub' } };
  assert.equal(classify(video, { filterVietsubChannels: false }), null);
  assert.equal(classify(video, { enabled: false }), null);
  assert.equal(classify(video, { allowedChannels: ['Phim Vietsub'] }), null);
  assert.equal(classify({ title: 'Bản Vietsub', channel: { name: 'Phim Hay', path: '/channel/IDVietsub' } }), null);
  assert.equal(classify({ title: 'Một ngày bình thường', channel: { name: 'Du lịch Việt Nam' } }), null);
  assert.equal(cleanSettings({ enabled: true }).filterVietsubChannels, true);
});
