const log = document.getElementById('log');
const startBtn = document.getElementById('start');
const apiKeyInput = document.getElementById('apiKey');
const saveKeyBtn = document.getElementById('saveKey');
let running = false;

function append(text) {
  log.textContent += text + '\n';
}

function loadKey() {
  const k = localStorage.getItem('openai_key') || '';
  apiKeyInput.value = k;
}

function saveKey() {
  localStorage.setItem('openai_key', apiKeyInput.value.trim());
  append('API key saved');
}

async function capture() {
  const response = await chrome.runtime.sendMessage({type: 'capture'});
  return response.image;
}

async function recognize(image) {
  append('Running OCR...');
  const worker = Tesseract.createWorker();
  await worker.load();
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  const { data: { text } } = await worker.recognize(image);
  await worker.terminate();
  append('OCR done');
  return text;
}

async function askAI(text) {
  append('Querying AI...');
  const apiKey = localStorage.getItem('openai_key');
  if (!apiKey) {
    append('No API key set.');
    return '';
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You answer quiz questions succinctly.' },
        { role: 'user', content: text }
      ]
    })
  });
  const data = await res.json();
  const answer = data.choices[0].message.content.trim();
  append('AI answered: ' + answer);
  return answer;
}

function send(tabId, msg) {
  return new Promise(res => chrome.tabs.sendMessage(tabId, msg, res));
}

async function solveCurrent(tabId) {
  append('Capturing...');
  const img = await capture();
  const text = await recognize(img);
  append(text);
  const answer = await askAI(text);
  if (!answer) return false;
  const type = inferType(text);
  await send(tabId, {type: 'fill', questionType: type, answer});
  const hasNext = await send(tabId, {type: 'hasButton', text: 'Next'});
  const hasCnNext = await send(tabId, {type: 'hasButton', text: '下一题'});
  const hasSubmit = await send(tabId, {type: 'hasButton', text: 'Submit'});
  const hasCnSubmit = await send(tabId, {type: 'hasButton', text: '提交'});
  if (hasNext?.exists || hasCnNext?.exists) {
    await send(tabId, {type: 'clickButton', text: 'Next'});
    await send(tabId, {type: 'clickButton', text: '下一题'});
    return true;
  } else if (hasSubmit?.exists || hasCnSubmit?.exists) {
    await send(tabId, {type: 'clickButton', text: 'Submit'});
    await send(tabId, {type: 'clickButton', text: '提交'});
    return false;
  }
  append('No navigation button found');
  return false;
}

async function solve() {
  running = true;
  startBtn.disabled = true;
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  while (running) {
    const cont = await solveCurrent(tab.id);
    if (!cont) break;
    await new Promise(r => setTimeout(r, 2000));
  }
  running = false;
  startBtn.disabled = false;
}

function inferType(text) {
  text = text.toLowerCase();
  if (text.includes('true') || text.includes('false')) return 'bool';
  if (text.includes('choose one')) return 'single';
  if (text.includes('choose all')) return 'multiple';
  return 'fill';
}

startBtn.addEventListener('click', solve);
saveKeyBtn.addEventListener('click', saveKey);
document.addEventListener('DOMContentLoaded', loadKey);
