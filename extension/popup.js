const log = document.getElementById('log');
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');
const apiKeyInput = document.getElementById('apiKey');
const saveKeyBtn = document.getElementById('saveKey');
const questionEl = document.getElementById('question');
const analysisEl = document.getElementById('analysis');
const countEl = document.getElementById('count');
const lastActionsEl = document.getElementById('lastActions');
const totalActionsEl = document.getElementById('totalActions');
let running = false;
let count = 0;
let totalActions = 0;

async function ocrImage(image) {
  try {
    if (typeof Tesseract === 'undefined') {
      await import('https://cdn.jsdelivr.net/npm/tesseract.js@5.0.3/dist/tesseract.esm.min.js');
    }
    const { data: { text } } = await Tesseract.recognize(image, 'eng');
    append('OCR: ' + text.trim().slice(0, 80));
    return text;
  } catch (e) {
    append('OCR failed: ' + e.message);
    return '';
  }
}

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

async function extractElements(tabId) {
  const res = await send(tabId, {type: 'extractNodes'});
  return res?.elements || [];
}

async function askAI(image, elements, ocrText) {
  append('Querying AI...');
  const apiKey = localStorage.getItem('openai_key');
  if (!apiKey) {
    append('No API key set.');
    return null;
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a web quiz solving bot. Using the following OCR text, screenshot and list of form elements, identify the question and compute the answer. Respond only with JSON {"question":"","analysis":"","actions":[]} where actions use CSS selectors.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: ocrText || '' },
            { type: 'image_url', image_url: { url: image } },
            { type: 'text', text: JSON.stringify(elements) }
          ]
        }
      ],
      max_tokens: 400
    })
  });
  const data = await res.json();
  const answer = data.choices?.[0]?.message?.content || '';
  append('AI answered: ' + answer);
  let jsonText = '';
  const match = answer.match(/\{[\s\S]*\}/);
  if (match) jsonText = match[0];
  try {
    const parsed = JSON.parse(jsonText || answer);
    if (parsed.question) {
      append('Q: ' + parsed.question);
      questionEl.textContent = parsed.question;
    }
    if (parsed.analysis) {
      append('Analysis: ' + parsed.analysis);
      analysisEl.textContent = parsed.analysis;
    }
    return parsed.actions;
  } catch(e) {
    append('Failed to parse actions');
    return null;
  }
}

function send(tabId, msg) {
  return new Promise(res => chrome.tabs.sendMessage(tabId, msg, res));
}

async function solveCurrent(tabId) {
  append('Capturing...');
  const img = await capture();
  const elements = await extractElements(tabId);
  const ocrText = await ocrImage(img);
  const actions = await askAI(img, elements, ocrText);
  if (!actions) return false;
  await send(tabId, {type: 'runActions', actions});
  append('Executed ' + actions.length + ' actions');
  lastActionsEl.textContent = String(actions.length);
  totalActions += actions.length;
  totalActionsEl.textContent = String(totalActions);

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
  stopBtn.disabled = false;
  questionEl.textContent = '';
  analysisEl.textContent = '';
  log.textContent = '';
  count = 0;
  countEl.textContent = '0';
  totalActions = 0;
  totalActionsEl.textContent = '0';
  lastActionsEl.textContent = '0';
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  while (running) {
    const cont = await solveCurrent(tab.id);
    if (cont) {
      count += 1;
      countEl.textContent = String(count);
    }
    if (!cont) break;
    await new Promise(r => setTimeout(r, 2000));
  }
  running = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
}

startBtn.addEventListener('click', solve);
stopBtn.addEventListener('click', () => {
  running = false;
  stopBtn.disabled = true;
  startBtn.disabled = false;
  append('Stopped');
  lastActionsEl.textContent = '0';
});
saveKeyBtn.addEventListener('click', saveKey);
document.addEventListener('DOMContentLoaded', loadKey);
