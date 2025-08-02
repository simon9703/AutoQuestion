function findInputs() {
  return Array.from(document.querySelectorAll('input, textarea, select'));
}

function getUniqueSelector(el) {
  if (el.id) return `#${el.id}`;
  const path = [];
  while (el && el.nodeType === 1 && path.length < 4) {
    let selector = el.nodeName.toLowerCase();
    if (el.className) {
      const classes = el.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (classes) selector += `.${classes}`;
    }
    const sibling = Array.from(el.parentNode.children).filter(e => e.nodeName == el.nodeName);
    if (sibling.length > 1) selector += `:nth-child(${Array.from(el.parentNode.children).indexOf(el)+1})`;
    path.unshift(selector);
    el = el.parentNode;
  }
  return path.join('>');
}

function extractNodes() {
  const elements = [];
  document.querySelectorAll('input, button, select, textarea, label').forEach((el, idx) => {
    const rect = el.getBoundingClientRect();
    elements.push({
      tag: el.tagName.toLowerCase(),
      type: el.type || '',
      text: el.innerText || el.value || el.placeholder || '',
      selector: getUniqueSelector(el),
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      index: idx
    });
  });
  return elements;
}

function executeActions(actions) {
  actions.forEach(a => {
    const el = document.querySelector(a.selector);
    if (!el) return;
    if (a.action === 'click') {
      el.click();
    }
    if (a.action === 'input') {
      el.value = a.value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
}

function matchOption(optionText, answer) {
  return optionText.trim().toLowerCase() === answer.trim().toLowerCase();
}

function fillAnswer(type, answer) {
  const inputs = findInputs();
  if (!inputs.length) return;

  switch (type) {
    case 'fill':
      const input = inputs.find(el => el.type === 'text' || el.tagName === 'TEXTAREA');
      if (input) input.value = answer;
      break;
    case 'single':
    case 'bool':
      inputs.forEach(el => {
        if (el.type === 'radio' || el.type === 'checkbox') {
          const label = document.querySelector(`label[for="${el.id}"]`);
          const text = label ? label.innerText : el.value;
          if (matchOption(text, answer)) {
            el.click();
          }
        }
      });
      break;
    case 'multiple':
      const answers = Array.isArray(answer) ? answer : answer.split(/[,;\s]+/);
      inputs.forEach(el => {
        if (el.type === 'checkbox') {
          const label = document.querySelector(`label[for="${el.id}"]`);
          const text = label ? label.innerText : el.value;
          if (answers.some(a => matchOption(text, a))) {
            if (!el.checked) el.click();
          }
        }
      });
      break;
  }
}

function hasButton(text) {
  const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
  const t = text.trim().toLowerCase();
  return Array.from(buttons).some(btn => {
    const bText = (btn.innerText || btn.value || '').trim().toLowerCase();
    return bText.includes(t);
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'fill') {
    fillAnswer(msg.questionType, msg.answer);
  } else if (msg.type === 'clickButton') {
    const target = (msg.text || '').trim().toLowerCase();
    const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
    buttons.forEach(btn => {
      const bText = (btn.innerText || btn.value || '').trim().toLowerCase();
      if (bText.includes(target)) {
        btn.click();
      }
    });
  } else if (msg.type === 'hasButton') {
    sendResponse({exists: hasButton(msg.text)});
  } else if (msg.type === 'extractNodes') {
    sendResponse({elements: extractNodes()});
  } else if (msg.type === 'runActions') {
    executeActions(msg.actions || []);
  }
  return true;
});
