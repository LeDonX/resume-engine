const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, '简历.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const match = html.match(/<script>([\s\S]*)<\/script>/);
if (!match) {
  throw new Error('Inline script not found');
}
const scriptContent = match[1];

class MockElement {
  constructor(tagName = 'div', id = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.children = [];
    this.parentNode = null;
    this.dataset = {};
    this.style = {};
    this.attributes = {};
    this.listeners = {};
    this.className = '';
    this.textContent = '';
    this.value = '';
    this.checked = false;
    this.files = null;
    this.clientHeight = 1040;
    this._innerHTML = '';
    this._selectorMap = new Map();
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];
    this._selectorMap = new Map();
    if (this._innerHTML.includes('resume-left')) {
      const left = new MockElement('div');
      left.className = 'resume-left';
      left.clientHeight = 1040;
      const right = new MockElement('div');
      right.className = 'resume-right';
      right.clientHeight = 1040;
      this._selectorMap.set('.resume-left', left);
      this._selectorMap.set('.resume-right', right);
      left.parentNode = this;
      right.parentNode = this;
      this.children = [left, right];
    }
  }

  get innerHTML() {
    return this._innerHTML;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
    }
    child.parentNode = null;
    return child;
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  querySelector(selector) {
    return this._selectorMap.get(selector) || null;
  }

  insertAdjacentHTML(_position, html) {
    const child = new MockElement('div');
    child.innerHTML = html;
    const text = String(html);
    const density = (text.match(/<li/g) || []).length * 28
      + (text.match(/resume-avoid-break/g) || []).length * 40
      + (text.match(/<p/g) || []).length * 12
      + Math.ceil(text.length / 18);
    const previousBottom = this.children.length ? this.children[this.children.length - 1]._bottom : 0;
    child._height = Math.max(120, density);
    child._bottom = previousBottom + child._height;
    child.parentNode = this;
    this.children.push(child);
  }

  get lastElementChild() {
    return this.children.length ? this.children[this.children.length - 1] : null;
  }

  getBoundingClientRect() {
    return { top: 0, bottom: this._bottom || this.clientHeight || 0 };
  }

  addEventListener(type, handler) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(handler);
  }

  async dispatchEvent(type, event = {}) {
    const handlers = this.listeners[type] || [];
    for (const handler of handlers) {
      await handler({ target: this, currentTarget: this, ...event });
    }
  }

  click() {}

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  setAttribute(name, value) {
    this.attributes[name] = String(value);
  }
}

class MockFileReader {
  constructor() {
    this.result = null;
    this.error = null;
    this.onload = null;
    this.onerror = null;
  }

  readAsDataURL(file) {
    try {
      const buffer = file && file.__buffer ? file.__buffer : Buffer.alloc(0);
      this.result = `data:${file.type};base64,${buffer.toString('base64')}`;
      if (typeof this.onload === 'function') {
        this.onload();
      }
    } catch (error) {
      this.error = error;
      if (typeof this.onerror === 'function') {
        this.onerror();
      }
    }
  }
}

const elements = new Map();
function makeElement(id, tagName = 'div') {
  const element = new MockElement(tagName, id);
  elements.set(id, element);
  return element;
}

const document = {
  title: '',
  fonts: { ready: Promise.resolve() },
  body: new MockElement('body', 'body'),
  getElementById(id) {
    if (!elements.has(id)) {
      return makeElement(id, id === 'import-file' ? 'input' : 'div');
    }
    return elements.get(id);
  },
  createElement(tagName) {
    return new MockElement(tagName);
  }
};

makeElement('form-root');
makeElement('resume-root');
makeElement('form-status');
makeElement('reset-data', 'button');
makeElement('export-data', 'button');
makeElement('import-data', 'button');
makeElement('import-file', 'input');
makeElement('print-pdf', 'button');

const storage = new Map();
const localStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
  removeItem(key) {
    storage.delete(key);
  }
};

const windowObj = {
  document,
  localStorage,
  requestAnimationFrame(callback) {
    callback();
  },
  clearTimeout,
  setTimeout,
  addEventListener() {},
  removeEventListener() {},
  getComputedStyle() {
    return { marginBottom: '0' };
  },
  print() {
    windowObj.__printCalled = (windowObj.__printCalled || 0) + 1;
  },
  __printCalled: 0
};
windowObj.window = windowObj;
windowObj.self = windowObj;
windowObj.globalThis = windowObj;

const context = vm.createContext({
  window: windowObj,
  document,
  localStorage,
  console,
  Blob,
  URL: {
    createObjectURL() { return 'blob:mock'; },
    revokeObjectURL() {}
  },
  FileReader: MockFileReader,
  Sortable: { create() { return { destroy() {} }; } },
  setTimeout,
  clearTimeout,
  requestAnimationFrame: windowObj.requestAnimationFrame,
  Object,
  JSON,
  Math,
  Number,
  String,
  Boolean,
  Array,
  Promise,
  RegExp,
  Date,
  Buffer
});
context.window = windowObj;
context.globalThis = context;
context.self = context;

vm.runInContext(scriptContent, context, { filename: '简历.html:inline-script' });

const resumeApp = context.window.__resumeApp__;
if (!resumeApp) {
  throw new Error('App bootstrap failed');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function makeUploadFile(name, type, filePath) {
  const buffer = fs.readFileSync(filePath);
  return { name, type, size: buffer.length, __buffer: buffer };
}

async function trigger(elementId, type, extra = {}) {
  const element = document.getElementById(elementId);
  await element.dispatchEvent(type, extra);
}

async function main() {
  const fixtureDir = path.join(root, 'tests', 'fixtures');
  const okFile = makeUploadFile('avatar-ok.png', 'image/png', path.join(fixtureDir, 'avatar-ok.png'));
  const txtFile = makeUploadFile('not-image.txt', 'text/plain', path.join(fixtureDir, 'not-image.txt'));
  const oversizeBuffer = fs.readFileSync(path.join(fixtureDir, 'avatar-oversize.jpg'));
  const oversizeFile = { name: 'avatar-oversize.jpg', type: 'image/jpeg', size: oversizeBuffer.length, __buffer: oversizeBuffer };
  const importJsonText = fs.readFileSync(path.join(fixtureDir, 'new-schema-sample.json'), 'utf8');

  const evidence = {};

  const basicInfoHtml = context.renderBasicInfo([
    { id: 'phone', label: '手机', value: 'https://example.com', iconPreset: 'phone', iconMode: 'preset', customIcon: '' }
  ]);
  assert(!basicInfoHtml.includes('<a '), 'basicInfo preview still renders anchors');
  evidence.basicInfoTextOnly = true;

  resumeApp.openAvatarCropper('空头像');
  resumeApp.confirmAvatarCrop();
  const emptyAvatarState = resumeApp.getResumeData();
  assert(emptyAvatarState.profileImage === '', 'confirming empty avatar should not persist fallback image');
  evidence.emptyAvatarConfirmPreserved = true;

  await context.handleAvatarUpload(okFile);
  const cropState = resumeApp.getAvatarCropState();
  assert(cropState, 'valid avatar upload did not open crop modal state');
  assert(resumeApp.getResumeData().profileImage === '', 'upload should not commit avatar before confirm');
  assert(resumeApp.getStatusText().includes('请在裁切框中调整后确认'), 'crop modal guidance missing after upload');
  evidence.validUploadStatus = resumeApp.getStatusText();

  context.applyFieldUpdate({ dataset: { section: 'avatarFrame', field: 'zoom' }, type: 'range', value: '1.72' });
  const zoomReadoutAfterChange = context.renderAvatarCropModal();
  assert(zoomReadoutAfterChange.includes('data-testid="avatar-zoom-readout"'), 'crop modal zoom readout missing');
  assert(zoomReadoutAfterChange.includes('当前缩放 1.72x'), 'crop modal zoom readout did not update');
  assert(!zoomReadoutAfterChange.includes('data-testid="avatar-position-readout"'), 'crop modal position block should be removed');
  assert(!zoomReadoutAfterChange.includes('继续放大后应用'), 'confirm button label should not expand in invalid state');
  assert(zoomReadoutAfterChange.includes('data-testid="avatar-crop-center"'), 'quick center action missing');
  assert(zoomReadoutAfterChange.includes('data-testid="avatar-crop-show-full"'), 'quick show-full action missing');
  assert(zoomReadoutAfterChange.includes('data-testid="avatar-crop-fill-frame"'), 'quick fill-frame action missing');
  resumeApp.dragAvatarCropFrame(24, -30, 420, 420);
  const cropAfterAdjust = resumeApp.getAvatarCropState();
  assert(cropAfterAdjust.frame.zoom === 1.72, 'crop zoom not applied');
  assert(cropAfterAdjust.frame.offsetX !== 0 || cropAfterAdjust.frame.offsetY !== 0, 'crop drag did not change offsets');
  resumeApp.confirmAvatarCrop();

  const afterFrame = resumeApp.getResumeData();
  assert(afterFrame.profileImage.startsWith('data:image/png;base64,'), 'confirmed crop did not persist data URL');
  assert(afterFrame.avatarFrame.zoom === 1.72, 'confirmed avatar zoom not applied');
  assert(resumeApp.getStatusText().includes('头像已更新并保存'), 'confirm success status missing');
  const reloaded = context.loadDraft();
  assert(reloaded.avatarFrame.zoom === 1.72, 'avatar frame did not survive draft reload');
  evidence.framingReload = reloaded.avatarFrame;

  const previewHtml = context.buildLeftColumnBlocks(afterFrame, context.getAvatarImageSource(afterFrame.profileImage)).join('');
  assert(previewHtml.includes('data-testid="avatar-preview-image"'), 'avatar preview selector missing');
  const basicFormHtml = context.renderBasicForm();
  assert(basicFormHtml.includes('上传头像'), 'avatar upload entry missing');
  assert(basicFormHtml.includes('调整头像'), 'avatar adjustment entry missing');
  assert(previewHtml.includes('data-avatar-zoom="1.72"'), 'avatar preview zoom data attribute missing');
  assert(previewHtml.includes(`data-avatar-offset-y="${afterFrame.avatarFrame.offsetY}"`), 'avatar preview offset data attribute missing');
  evidence.previewDataAttributes = true;

  resumeApp.openAvatarCropper('当前头像');
  const beforeCancelFrame = JSON.stringify(resumeApp.getResumeData().avatarFrame);
  resumeApp.dragAvatarCropFrame(-36, 18, 420, 420);
  resumeApp.cancelAvatarCrop();
  assert(JSON.stringify(resumeApp.getResumeData().avatarFrame) === beforeCancelFrame, 'cancel crop should not change committed avatar frame');
  evidence.cancelPreservedCommittedAvatar = true;

  const beforeInvalidSrc = resumeApp.getResumeData().profileImage;
  await context.handleAvatarUpload(txtFile);
  assert(resumeApp.getStatusText().includes('仅支持 PNG、JPG、JPEG、WEBP'), 'invalid file error missing');
  assert(resumeApp.getResumeData().profileImage === beforeInvalidSrc, 'invalid upload replaced prior avatar');
  evidence.invalidUploadStatus = resumeApp.getStatusText();

  await context.handleAvatarUpload(oversizeFile);
  assert(resumeApp.getStatusText().includes('文件不能超过 2 MB'), 'oversize file error missing');
  assert(resumeApp.getResumeData().profileImage === beforeInvalidSrc, 'oversize upload replaced prior avatar');
  evidence.oversizeUploadStatus = resumeApp.getStatusText();

  const originalSetItem = localStorage.setItem;
  localStorage.setItem = () => {
    throw new Error('forced failure');
  };
  await context.handleAvatarUpload(okFile);
  assert(resumeApp.getAvatarCropState(), 'storage failure path should still open crop state before confirm');
  resumeApp.confirmAvatarCrop();
  assert(resumeApp.getStatusText().includes('头像保存失败'), 'storage failure message missing');
  assert(resumeApp.getResumeData().profileImage === beforeInvalidSrc, 'storage failure did not roll back avatar');
  localStorage.setItem = originalSetItem;
  evidence.storageFailureStatus = resumeApp.getStatusText();

  vm.runInContext('resumeData.basicInfo[0].iconMode = "custom"; resumeData.basicInfo[0].customIcon = "fas fa-star";', context);
  const customHtml = context.renderBasicInfo(resumeApp.getResumeData().basicInfo);
  assert(customHtml.includes('fas fa-star'), 'custom basic info icon not rendered');
  context.handleAction('move-basic-info-down', 0);
  assert(resumeApp.getResumeData().basicInfo[1].id === 'phone', 'basic info order did not update');
  evidence.iconOrderPreserved = true;

  await trigger('export-data', 'click');
  const exported = JSON.parse(resumeApp.getLastExportedJson());
  assert(exported.avatarFrame && typeof exported.avatarFrame.zoom === 'number', 'export missing avatarFrame');
  assert(exported.basicInfo.every((item) => !Object.prototype.hasOwnProperty.call(item, 'url')), 'export still includes basicInfo.url');
  evidence.exportSchema = {
    avatarFrame: exported.avatarFrame,
    hasBasicInfoUrl: exported.basicInfo.some((item) => Object.prototype.hasOwnProperty.call(item, 'url'))
  };

  const importInput = document.getElementById('import-file');
  importInput.files = [{ name: 'new-schema-sample.json', async text() { return importJsonText; } }];
  await trigger('import-file', 'change');
  const afterImport = resumeApp.getResumeData();
  assert(afterImport.name === '李四', 'import did not apply new schema sample');
  assert(afterImport.avatarFrame.zoom === 1.35 && afterImport.avatarFrame.offsetY === -18, 'import did not restore avatarFrame');
  assert(afterImport.basicInfo.every((item) => !Object.prototype.hasOwnProperty.call(item, 'url')), 'import normalized url back into basicInfo');
  evidence.importSchema = afterImport.avatarFrame;

  vm.runInContext(`
    const data = cloneData(resumeData);
    data.summary = Array.from({ length: 30 }, () => '长段落内容').join(' ');
    data.experiences = Array.from({ length: 12 }, (_, index) => ({
      title: '职位' + index,
      company: '公司' + index,
      period: '2020 - 202' + (index % 10),
      highlight: index === 0,
      bullets: Array.from({ length: 5 }, (_, bulletIndex) => '职责 ' + index + '-' + bulletIndex)
    }));
    data.projects = Array.from({ length: 8 }, (_, index) => ({
      name: '项目' + index,
      badge: '负责',
      badgeStyle: index % 2 ? 'primary' : 'secondary',
      description: '项目描述'.repeat(12),
      techs: ['HTML', 'CSS', 'JS']
    }));
    resumeData = data;
    renderAll();
  `, context);
  const renderedHtml = document.getElementById('resume-root').innerHTML;
  const pageCount = (renderedHtml.match(/class="resume-page/g) || []).length;
  assert(pageCount >= 2, 'pagination did not produce multiple pages under long content');
  windowObj.__printCalled = 0;
  await trigger('print-pdf', 'click');
  assert(windowObj.__printCalled === 1, 'print flow did not call window.print');
  evidence.printPagination = { pageCount, printCalled: windowObj.__printCalled };

  const persistedDraft = JSON.parse(localStorage.getItem('resume-generator-draft-v1'));
  assert(persistedDraft.avatarFrame && typeof persistedDraft.avatarFrame.zoom === 'number', 'localStorage draft missing avatarFrame');
  assert(persistedDraft.basicInfo.every((item) => !Object.prototype.hasOwnProperty.call(item, 'url')), 'localStorage draft includes basicInfo.url');
  evidence.localStorageShape = true;

  return evidence;
}

main().then((evidence) => {
  process.stdout.write(JSON.stringify({ ok: true, evidence }, null, 2));
}).catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
