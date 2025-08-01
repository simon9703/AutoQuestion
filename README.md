# AutoQuestion Chrome Extension

This project contains a proof‑of‑concept Chrome extension that uses the OpenAI API to automatically recognise simple quiz questions on a web page and attempt to fill in answers.

## Features

- Captures the current tab as an image and extracts all interactive elements. A lightweight OCR step attempts to read text from the screenshot.
- Sends the screenshot and element structure to the OpenAI API which returns a list of DOM actions.
- Executes the returned actions to fill in answers or click navigation buttons until submission.
- Provides a popup UI to save your API key, start/stop solving and display logs, recognised questions and AI analysis.
- Tracks how many questions have been answered during a solving session.
- Displays how many DOM actions are executed for each question and the running total.

## Usage

1. Open the `extension/` folder in Chrome's Extension settings (`chrome://extensions`), enable developer mode and load it as an unpacked extension.
2. Click the extension icon and enter your OpenAI API key. Press **Save Key** to store it.
3. Press **Capture & Solve** to begin answering. Use **Stop** to halt the process at any time.
4. The extension captures the visible tab, asks the AI for DOM actions and executes them while automatically clicking "Next" or "Submit". The popup shows the recognised question text, analysis, the number of actions taken for the last question and a running total.

This is a minimal example and may need additional logic to reliably locate form fields or navigate multi‑page quizzes.

The OCR feature uses [Tesseract.js](https://github.com/naptha/tesseract.js). The extension dynamically loads the library from a CDN, so network access is required when using this feature.
