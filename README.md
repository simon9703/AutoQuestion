# AutoQuestion Chrome Extension

This project contains a proof-of-concept Chrome extension that uses OCR and the OpenAI API to automatically recognise quiz questions on a web page and attempt to fill in answers.

## Features

- Captures the current tab as an image and extracts interactive elements.
- Runs OCR using `tesseract.js` on the screenshot.
- Sends the screenshot, OCR text and element structure to OpenAI which returns DOM actions or answers.
- Executes these actions to fill answers or click navigation buttons such as "Next"/"下一题" and "Submit"/"提交".
- Provides a popup UI to save your API key, start/stop solving and display logs, recognised questions and analysis.
- Tracks how many questions have been answered and how many DOM actions are executed during a session.

## Usage

1. Open the `extension/` folder in Chrome's Extension settings (`chrome://extensions`), enable developer mode and load it as an unpacked extension.
2. Click the extension icon and enter your OpenAI API key. Press **Save Key** to store it.
3. Press **Capture & Solve** to begin answering. Use **Stop** to halt the process at any time.
4. The extension captures the visible tab, runs OCR, asks the AI for DOM actions and executes them while automatically clicking navigation buttons. The popup shows the recognised question text, analysis and action counts.

This is a minimal example and may need additional logic to reliably locate form fields or navigate multi-page quizzes.

The OCR library is loaded from a CDN, so network access is required for this feature.
