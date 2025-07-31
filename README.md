# AutoQuestion Chrome Extension

This project contains a proof‑of‑concept Chrome extension that uses OCR and an AI API to automatically recognise simple quiz questions on a web page and attempt to fill in answers.

## Features

- Captures the current tab as an image and runs OCR (using `tesseract.js`).
- Sends the recognised text to an OpenAI API endpoint to receive an answer.
- Tries to infer the question type (fill in the blank, single choice, multiple choice or boolean).
- Injects the answer back into the page by selecting appropriate form elements.
- Automatically clicks "Next"/"下一题" as each question is solved and finally presses "Submit"/"提交".
- Provides a popup UI to save your API key, start the process and display logs of recognised text and answers.

## Usage

1. Open the `extension/` folder in Chrome's Extension settings (`chrome://extensions`), enable developer mode and load it as an unpacked extension.
2. Click the extension icon and enter your OpenAI API key. Press **Save Key** to store it.
3. Press **Capture & Solve**. The extension captures the visible tab, runs OCR and asks the AI for an answer.
4. Answers are filled into the page. If a "Next" button is found the extension waits for the next question and repeats automatically until "Submit" is clicked.

This is a minimal example and may need additional logic to reliably locate form fields or navigate multi‑page quizzes.
