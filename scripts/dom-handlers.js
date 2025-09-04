// dom-handlers.js

export function setupUI(
  recordBtn,
  stopBtn,
  pickImageBtn,
  mainHeading,
  statusDiv,
  transcribedTextDiv,
  ollamaOutputDiv,
  assessmentPlaceholder,
  displayRandomImage,
  startRecording,
  stopRecording
) {
  // Initial setup on page load
  displayRandomImage();

  // Button click handlers
  recordBtn.onclick = () => {
    // Reset UI before starting
    assessmentPlaceholder.style.display = "block";
    ollamaOutputDiv.innerHTML = '<p class="text-gray-400 text-center">Your IELTS assessment will appear here.</p>';
    transcribedTextDiv.textContent = "";

    startRecording();
  };

  stopBtn.onclick = () => {
    stopRecording();
  };

  pickImageBtn.onclick = () => {
    transcribedTextDiv.textContent = "";
    ollamaOutputDiv.innerHTML = '<p class="text-gray-400 text-center">Your IELTS assessment will appear here.</p>';
    displayRandomImage();
  };
}

export function updateUIForRecordingStart(
  recordBtn,
  stopBtn,
  pickImageBtn,
  mainHeading,
  statusDiv
) {
  statusDiv.textContent = "Listening... Speak clearly into your microphone.";
  recordBtn.style.display = "none";
  stopBtn.style.display = "inline-block";
  pickImageBtn.disabled = true;
  mainHeading.textContent = "Describe the image assessment";
}

export function updateUIForRecordingEnd(
  recordBtn,
  stopBtn,
  pickImageBtn,
  statusDiv
) {
  statusDiv.textContent = "Processing your speech...";
  recordBtn.style.display = "inline-block";
  stopBtn.style.display = "none";
  pickImageBtn.disabled = false;
}

export function updateUIForOllamaStart(
  recordBtn,
  stopBtn,
  pickImageBtn,
  ollamaOutputDiv
) {
  recordBtn.disabled = true;
  stopBtn.disabled = true;
  pickImageBtn.disabled = true;
  ollamaOutputDiv.innerHTML = '<p class="text-gray-400 text-center animate-pulse">Waiting for Ollama response...</p>';
}

export function updateUIForOllamaEnd(
  recordBtn,
  stopBtn,
  pickImageBtn
) {
  recordBtn.disabled = false;
  stopBtn.disabled = false;
  pickImageBtn.disabled = false;
}

export function displayAssessment(
  ollamaOutputDiv,
  ollamaText,
  statusDiv,
  mainHeading
) {
  ollamaOutputDiv.innerHTML = `<pre class="assessment-output text-gray-800">${ollamaText}</pre>`;
  statusDiv.textContent = "Assessment complete.";
  mainHeading.textContent = "IELTS Speaking Assessment";
}

export function displayError(
  ollamaOutputDiv,
  statusDiv,
  recordBtn,
  stopBtn,
  pickImageBtn,
  errorMessage
) {
  console.error("Error:", errorMessage);
  ollamaOutputDiv.innerHTML = `<p class="text-red-500 font-medium">Error connecting to Ollama.</p><p class="mt-2 text-sm text-gray-600">Please ensure Ollama is running and configured for CORS.</p>`;
  statusDiv.textContent = "Failed to get assessment.";
}
