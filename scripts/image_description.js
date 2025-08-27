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

  let recognition = null; // Declare recognition object globally
  let audioContext = null;
  let analyser = null;
  let mediaStreamSource = null;
  let micLevelInterval = null;
  let finalTranscript = ""; // Store the final transcription

  // List of placeholder image URLs with 'images/' prefix
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
  ];

  // Function to randomly pick and display an image
  function displayRandomImage() {
    const randomIndex = Math.floor(Math.random() * imageList.length);
    displayImage.src = imageList[randomIndex];
  }

  // Start the mic level visualizer
  async function startMicLevelVisualizer() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      mediaStreamSource = audioContext.createMediaStreamSource(stream);
      mediaStreamSource.connect(analyser);

      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      micLevelInterval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average =
          dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        const level = Math.min(100, average * 2 + 20); // Scale the level for a wider range
        micLevelIndicator.style.width = `${level}%`;
        if (level > 20) {
          micLevelIndicator.classList.add("level-active");
        } else {
          micLevelIndicator.classList.remove("level-active");
        }
      }, 50);
    } catch (e) {
      console.error("Error accessing microphone:", e);
      statusDiv.textContent =
        "Error: Could not access microphone. Please check permissions.";
    }
  }

  // Stop the mic level visualizer and clean up
  function stopMicLevelVisualizer() {
    clearInterval(micLevelInterval);
    micLevelIndicator.style.width = "0%";
    micLevelIndicator.classList.remove("level-active");
    if (mediaStreamSource) {
      mediaStreamSource.mediaStream
        .getTracks()
        .forEach((track) => track.stop());
    }
  }

  // Initial call to display a random image on page load
  displayRandomImage();

  // --- Check for Web Speech API Support ---
  if (
    !("webkitSpeechRecognition" in window) &&
    !("SpeechRecognition" in window)
  ) {
    statusDiv.textContent =
      "Your browser does not support the Web Speech API.";
    recordBtn.disabled = true;
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true; // Set to true to allow continuous listening
  recognition.interimResults = true; // Listen for interim results to show a running transcript
  recognition.lang = "en-US";

  // --- Event Listeners for Recognition ---
  recognition.onstart = () => {
    statusDiv.textContent =
      "Listening... Speak clearly into your microphone.";
    recordBtn.style.display = "none";
    stopBtn.style.display = "inline-block";
    pickImageBtn.disabled = true; // Disable the button instead of hiding it
    // Set the heading to the prompt
    mainHeading.textContent = "Describe the image assessment";
  };

  recognition.onend = () => {
    statusDiv.textContent = "Processing your speech...";
    recordBtn.style.display = "inline-block";
    stopBtn.style.display = "none";
    pickImageBtn.disabled = false; // Re-enable the button
    stopMicLevelVisualizer();
    // Send the final transcript to the API
    if (finalTranscript.trim() !== "") {
      transcribedTextDiv.textContent = `"${finalTranscript}"`;
      // The transcribed text container is now always visible
      getIeltsAssessment(finalTranscript);
    }
    finalTranscript = ""; // Reset for the next session
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
    recordBtn.style.display = "inline-block";
    stopBtn.style.display = "none";
    pickImageBtn.disabled = false; // Re-enable the button on error
    stopMicLevelVisualizer();
    finalTranscript = ""; // Reset on error
  };

  // --- Button click handlers ---
  recordBtn.onclick = () => {
    try {
      // Reset the assessment area with the placeholder text
      assessmentPlaceholder.style.display = "block";
      ollamaOutputDiv.innerHTML =
        '<p id="assessmentPlaceholder" class="text-gray-400 text-center">Your IELTS assessment will appear here.</p>';

      // Clear previous transcribed text and ensure the div has content to prevent layout shift
      transcribedTextDiv.textContent = "";

      startMicLevelVisualizer();
      finalTranscript = ""; // Clear previous transcript
      recognition.start();
    } catch (e) {
      statusDiv.textContent = `Error starting recognition: ${e.message}`;
      console.error(e);
    }
  };

  stopBtn.onclick = () => {
    recognition.stop();
  };

  pickImageBtn.onclick = () => {
    displayRandomImage();
  };

  // --- Function to call Ollama API ---
  async function getIeltsAssessment(text) {
    // Disable buttons to prevent multiple calls
    recordBtn.disabled = true;
    stopBtn.disabled = true;
    pickImageBtn.disabled = true;

    // IMPORTANT: CORS issue
    // To allow a browser to send a request to a local Ollama server,
    // you must either run Ollama with the --origins flag set to the
    // correct origin (e.g., OLLAMA_ORIGINS='http://localhost:8000')
    // or use a reverse proxy. This example will likely fail due to
    // CORS policies unless you configure your Ollama server.
    const ollamaUrl = "http://localhost:11434/api/generate";
    // Use a multi-modal model like llava
    const modelName = "llava";

    try {
      ollamaOutputDiv.innerHTML =
        '<p class="text-gray-400 text-center animate-pulse">Waiting for Ollama response...</p>';

      // Fetch the image from the display element and convert it to base64
      const imageUrl = displayImage.src;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      await new Promise((resolve) => (reader.onloadend = resolve));
      const base64Image = reader.result.split(",")[1];

      const prompt = `You are an expert IELTS Speaking examiner. The user has described an image. Your task is to:
1.  Provide your own concise description of the image.
2.  Compare your description with the user's transcribed text, which is: "${text}".
3.  Provide a detailed assessment of the user's response based on the comparison, focusing on accuracy and descriptive quality.`;

      const payload = {
        model: modelName,
        prompt: prompt,
        images: [base64Image], // Add image data to the payload
        stream: false,
      };

      const ollamaResponse = await fetch(ollamaUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!ollamaResponse.ok) {
        throw new Error(
          `HTTP error! status: ${ollamaResponse.status}. Make sure Ollama is running and configured for CORS.`
        );
      }

      const data = await ollamaResponse.json();
      const ollamaText = data.response;

      ollamaOutputDiv.innerHTML = `<pre class="assessment-output text-gray-800">${ollamaText}</pre>`;
      statusDiv.textContent = "Assessment complete.";
      // Set the heading back to the original text
      mainHeading.textContent = "IELTS Speaking Assessment";
    } catch (error) {
      console.error("Error:", error);
      ollamaOutputDiv.innerHTML = `<p class="text-red-500 font-medium">Error connecting to Ollama.</p><p class="mt-2 text-sm text-gray-600">Please ensure Ollama is running and listening on port 11434. If you see a CORS error in the console, you may need to run Ollama with the correct origins, e.g., in your terminal: <br/><br/><code>OLLAMA_ORIGINS='http://localhost:8000' ollama serve</code><br/><br/>(replace 8000 with your web server's port)</p>`;
      statusDiv.textContent = "Failed to get assessment.";
    } finally {
      // Re-enable buttons regardless of success or failure
      recordBtn.disabled = false;
      stopBtn.disabled = false;
      pickImageBtn.disabled = false;
    }
  }
});