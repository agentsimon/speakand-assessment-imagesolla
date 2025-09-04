// app.js

import { setupUI, updateUIForRecordingStart, updateUIForRecordingEnd, updateUIForOllamaStart, updateUIForOllamaEnd, displayAssessment, displayError } from './dom-handlers.js';
import { startMicLevelVisualizer, stopMicLevelVisualizer } from './audio-visualizer.js';
import { getIeltsAssessment, getModelInfo } from './ollama-api.js';

document.addEventListener("DOMContentLoaded", () => {
  const displayImage = document.getElementById("displayImage");
  const recordBtn = document.getElementById("recordBtn");
  const stopBtn = document.getElementById("stopBtn");
  const pickImageBtn = document.getElementById("pickImageBtn");
  const statusDiv = document.getElementById("status");
  const transcribedTextDiv = document.getElementById("transcribedText");
  const ollamaOutputDiv = document.getElementById("ollamaOutput");
  const micLevelIndicator = document.getElementById("micLevelIndicator");
  const mainHeading = document.getElementById("mainHeading");
  const assessmentPlaceholder = document.getElementById("assessmentPlaceholder");
  const imageList = [
    "images/DSC_8597.jpg",
    "images/DSC_8688.jpg",
    "images/DSC_9379.png",
    "images/Gemini_Generated_Image_39psba39psba39ps.png",
    "images/IMG20250721174414.jpg",
    "images/IMG_20250721_184457.jpg",
    "images/bengal-tiger-from-Asia.webp",
    "images/bike.png",
    "images/swim.png",
    "images/kings-x-1024x483.jpg",
    "images/Ontario-Airport-1024x766.jpg",
    "images/dogs.jpg"
  ];

  let recognition = null;
  let finalTranscript = "";
  let currentImageIndex = 0; 

  function displayNextImage() {
    displayImage.src = imageList[currentImageIndex];
    currentImageIndex = (currentImageIndex + 1) % imageList.length;
  }

  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    statusDiv.textContent = "Your browser does not support the Web Speech API.";
    recordBtn.disabled = true;
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    updateUIForRecordingStart(recordBtn, stopBtn, pickImageBtn, mainHeading, statusDiv);
  };

  recognition.onend = () => {
    updateUIForRecordingEnd(recordBtn, stopBtn, pickImageBtn, statusDiv);
    stopMicLevelVisualizer(micLevelIndicator);

    if (finalTranscript.trim() !== "") {
      transcribedTextDiv.textContent = `"${finalTranscript}"`;
      handleAssessment(finalTranscript);
    }
    finalTranscript = "";
  };

  recognition.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript + " ";
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    transcribedTextDiv.textContent = finalTranscript + interimTranscript;
  };

  recognition.onerror = (event) => {
    statusDiv.textContent = `Error occurred in recognition: ${event.error}`;
    console.error(event.error);
    updateUIForRecordingEnd(recordBtn, stopBtn, pickImageBtn, statusDiv);
    stopMicLevelVisualizer(micLevelIndicator);
    finalTranscript = "";
  };

  function startRecording() {
    try {
      startMicLevelVisualizer(micLevelIndicator, statusDiv);
      finalTranscript = "";
      recognition.start();
    } catch (e) {
      statusDiv.textContent = `Error starting recognition: ${e.message}`;
      console.error(e);
    }
  }

  function stopRecording() {
    recognition.stop();
  }

async function handleAssessment(text) {
  updateUIForOllamaStart(recordBtn, stopBtn, pickImageBtn, ollamaOutputDiv);
  try {
    const ollamaText = await getIeltsAssessment(text, displayImage);
    
    // Create the HTML for the user's transcribed text
    const userTextHtml = `<h3>Your Response</h3><p>${text}</p>`;

    // Split the response by section titles
    const sections = ollamaText.split(/\n(?=\d+\. )/);
    
    let formattedHtml = '';
    sections.forEach((section) => {
        // Find the first line which is the heading
        const [heading, ...body] = section.split('\n');

        // Clean up the heading text
        const cleanHeading = heading.replace(/^\d+\. /, '').trim();

        // Join the body text back together and wrap in a <p> tag
        const bodyText = body.join('<br>').trim();
        formattedHtml += `<h3>${cleanHeading}</h3><p>${bodyText}</p>`;
    });

    // Combine the user's text and the formatted assessment
    const finalOutputHtml = userTextHtml + formattedHtml;

    displayAssessment(ollamaOutputDiv, finalOutputHtml, statusDiv, mainHeading);

  } catch (error) {
    displayError(ollamaOutputDiv, statusDiv, recordBtn, stopBtn, pickImageBtn, error);
  } finally {
    updateUIForOllamaEnd(recordBtn, stopBtn, pickImageBtn);
  }
}

  setupUI(
    recordBtn,
    stopBtn,
    pickImageBtn,
    mainHeading,
    statusDiv,
    transcribedTextDiv,
    ollamaOutputDiv,
    assessmentPlaceholder,
    displayNextImage,
    startRecording,
    stopRecording
  );

  displayNextImage();
});
