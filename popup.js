(() => {
  'use strict';
  const api = globalThis.YouTubeAIFilter;
  const fields = ['enabled', 'mode', 'compact', 'checkLabels', 'filterStories', 'filterVietsubChannels', 'channelKeywords', 'keywords', 'blockedChannels', 'allowedChannels'];
  const lists = ['keywords', 'channelKeywords', 'blockedChannels', 'allowedChannels'];
  const status = document.getElementById('status');
  const save = document.getElementById('save');
  const enabledBadge = document.getElementById('enabled-badge');
  function updateBadge(enabled) {
    enabledBadge.classList.toggle('off', !enabled);
    enabledBadge.replaceChildren(document.createElement('i'), document.createTextNode(enabled ? 'Đang bật' : 'Đã tắt'));
  }
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function selectTab(tab) {
    for (const item of tabs) {
      const selected = item === tab;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.dataset.panel).hidden = !selected;
    }
  }
  for (const tab of tabs) {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = tabs.indexOf(tab);
      const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : tabs[(index + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(next);
      next.focus();
    });
  }
  document.getElementById('settings-form').addEventListener('input', () => {
    status.textContent = 'Có thay đổi chưa lưu';
  });
  const count = document.getElementById('blocked-count');
  const countLabel = document.getElementById('count-label');
  let countBusy = false;
  async function updateCount() {
    if (countBusy) return;
    countBusy = true;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab');
      const result = await chrome.tabs.sendMessage(tab.id, { type: 'noai-status' });
      if (!Number.isInteger(result?.hidden) || result.hidden < 0) throw new Error('Invalid count');
      count.textContent = result.hidden.toLocaleString('vi-VN');
      countLabel.textContent = 'video đang bị chặn trên tab này';
    } catch {
      count.textContent = '—';
      countLabel.textContent = 'Mở tab YouTube; tải lại trang nếu vừa cài/cập nhật tiện ích.';
    } finally { countBusy = false; }
  }
  updateCount();
  const countTimer = setInterval(updateCount, 1000);
  window.addEventListener('pagehide', () => clearInterval(countTimer));
  save.disabled = true;
  chrome.storage.local.get('settings').then(saved => {
    const settings = api.cleanSettings(saved.settings);
    updateBadge(settings.enabled);
    for (const key of fields) {
      const element = document.getElementById(key);
      if (element.type === 'checkbox') element.checked = settings[key];
      else element.value = lists.includes(key) ? settings[key].join('\n') : settings[key];
    }
    save.disabled = false;
  }).catch(() => { status.textContent = 'Không đọc được cài đặt. Hãy mở lại tiện ích.'; });
  document.getElementById('settings-form').addEventListener('submit', async event => {
    event.preventDefault();
    save.disabled = true;
    const values = {};
    for (const key of fields) {
      const element = document.getElementById(key);
      values[key] = element.type === 'checkbox' ? element.checked : lists.includes(key) ? element.value.split('\n') : element.value;
    }
    try {
      await chrome.storage.local.set({ settings: api.cleanSettings(values) });
      updateBadge(values.enabled);
      status.textContent = 'Đã lưu · YouTube sẽ cập nhật tự động';
    } catch { status.textContent = 'Không lưu được cài đặt. Vui lòng thử lại.'; }
    finally { save.disabled = false; }
  });
})();
