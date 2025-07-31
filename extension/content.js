function findInputs() {
  return Array.from(document.querySelectorAll('input, textarea, select'));
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

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'fill') {
    fillAnswer(msg.questionType, msg.answer);
  } else if (msg.type === 'clickButton') {
    const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
    buttons.forEach(btn => {
      if (btn.innerText.includes(msg.text) || btn.value?.includes(msg.text)) {
        btn.click();
      }
    });
  }
});
