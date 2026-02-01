// Claude Context Bridge - Background Service Worker
// Handles native messaging to save files locally

const NATIVE_HOST_NAME = 'com.claude.contextbridge';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveContext') {
    // Send to native host
    chrome.runtime.sendNativeMessage(
      NATIVE_HOST_NAME,
      {
        filename: request.filename,
        content: request.content
      },
      response => {
        if (chrome.runtime.lastError) {
          console.error('Native messaging error:', chrome.runtime.lastError);
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message || 'Native host not found. Did you run the install script?'
          });
        } else {
          sendResponse(response || { success: true });
        }
      }
    );
    return true; // Keep channel open for async response
  }
});
