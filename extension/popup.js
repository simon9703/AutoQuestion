const log = document.getElementById('log');
const startBtn = document.getElementById('start');
const apiKeyInput = document.getElementById('apiKey');
const saveKeyBtn = document.getElementById('saveKey');

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

async function solve() {
  startBtn.disabled = true;
  append('Capturing...');
  const img = await capture();
  const text = await recognize(img);
  append(text);
  const answer = await askAI(text);
  if (!answer) {
    startBtn.disabled = false;
    return;
  }
  const type = inferType(text);
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, {type: 'fill', questionType: type, answer});
    chrome.tabs.sendMessage(tabs[0].id, {type: 'clickButton', text: 'Next'});
    chrome.tabs.sendMessage(tabs[0].id, {type: 'clickButton', text: '下一题'});
    chrome.tabs.sendMessage(tabs[0].id, {type: 'clickButton', text: 'Submit'});
    chrome.tabs.sendMessage(tabs[0].id, {type: 'clickButton', text: '提交'});
  });
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
