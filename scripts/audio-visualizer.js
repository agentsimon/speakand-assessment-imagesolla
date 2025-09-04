// audio-visualizer.js

let audioContext = null;
let analyser = null;
let mediaStreamSource = null;
let micLevelInterval = null;

export async function startMicLevelVisualizer(
  micLevelIndicator,
  statusDiv
) {
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
      const level = Math.min(100, average * 2 + 20);
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
    throw e; // Propagate error
  }
}

export function stopMicLevelVisualizer(micLevelIndicator) {
  clearInterval(micLevelInterval);
  micLevelIndicator.style.width = "0%";
  micLevelIndicator.classList.remove("level-active");
  if (mediaStreamSource) {
    mediaStreamSource.mediaStream
      .getTracks()
      .forEach((track) => track.stop());
  }
}
