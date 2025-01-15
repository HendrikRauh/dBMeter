const form = document.querySelector("form#sliders");

let threshold1 = null;
let threshold2 = null;
let speed = 20;
let maxAmplitude = 0;

const canvas = document.querySelector("canvas");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const canvasCtx = canvas.getContext("2d");
canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

const analyser = await createMicAnalyzer();
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

async function createMicAnalyzer() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: false,
  });
  const audioContext = new AudioContext();
  const mediaStreamAudioSourceNode =
    audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  mediaStreamAudioSourceNode.connect(analyser);

  return analyser;
}

function frame() {
  requestAnimationFrame(frame);

  analyser.getByteTimeDomainData(dataArray);

  // drawGraph();

  const amplitude = dataArray.reduce((max, value) => {
    return Math.max(max, value - 128);
  }, 0);
  // maxAmplitude -= (maxAmplitude ** 2) / 20;
  maxAmplitude -= Math.sqrt(maxAmplitude) / speed;
  // - Math.max(0.1, (maxAmplitude > threshold2 ? threshold2 : threshold1) * 0.1)
  maxAmplitude = Math.max(amplitude, maxAmplitude);
  console.log(maxAmplitude, speed);
  // const amplitude = Math.max.apply(Math, dataArray);

  let bgColor;
  if (maxAmplitude < threshold1) {
    bgColor = "red";
  } else if (maxAmplitude < threshold2) {
    bgColor = "yellow";
  } else {
    bgColor = "green";
  }
  document.body.style.backgroundColor = bgColor;
}

function drawGraph() {
  canvasCtx.fillStyle = "lightgrey";
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = "black";
  canvasCtx.beginPath();
  const sliceWidth = WIDTH / bufferLength;
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = v * (HEIGHT / 2);

    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }

    x += sliceWidth;
  }
  canvasCtx.lineTo(WIDTH, HEIGHT / 2);
  canvasCtx.stroke();
}

form.addEventListener("input", (event) => {
  console.log(event.target.id, event.target.value);
  if (event.target.id === "slider1") {
    threshold1 = event.target.value;
  } else if (event.target.id === "slider2") {
    threshold2 = event.target.value;
  } else if (event.target.id === "slider-speed") {
    speed = event.target.value;
  }
});

form.querySelectorAll("input[type=range]").forEach((input) => {
  input.dispatchEvent(new Event("input", { bubbles: true }));
});

frame();
