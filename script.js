const c = {
    element: document.querySelector("canvas.bar"),
    ctx: document.querySelector("canvas.bar").getContext("2d"),

    get width() {
        return this.element.width;
    },

    get height() {
        return this.element.height;
    },
};

const _analyser = await createMicAnalyzer();
const sound = {
    analyser: _analyser,
    dataArray: new Uint8Array(_analyser.frequencyBinCount),
    threshold: {
        green: null,
        yellow: null,
    },
    hold: null,
    heldAmplitude: 0,
};

const style = window.getComputedStyle(document.body);
const color = {
    red: style.getPropertyValue("--red"),
    yellow: style.getPropertyValue("--yellow"),
    green: style.getPropertyValue("--green"),
    bar: "#4287f5",
    plate: "#86b2f9",
};

async function createMicAnalyzer() {
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
    });
    const audioContext = new AudioContext();
    const mediaStreamAudioSourceNode = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    mediaStreamAudioSourceNode.connect(analyser);

    return analyser;
}

function frame() {
    requestAnimationFrame(frame);

    sound.analyser.getByteTimeDomainData(sound.dataArray);

    const amplitude = sound.dataArray.reduce((max, value) => {
        return Math.max(max, Math.abs(value - 128));
    }, 0);
    if (amplitude > sound.heldAmplitude) {
        sound.heldAmplitude = amplitude;
    } else {
        sound.heldAmplitude -= Math.max(0.1, Math.sqrt(sound.heldAmplitude) / sound.hold);
    }
    console.log(amplitude);

    drawBar(amplitude, sound.heldAmplitude);

    document.body.style.backgroundColor = determineBgColor(sound.heldAmplitude);
}

function drawBar(currentAmplitude, heldAmplitude) {
    // background
    c.ctx.fillStyle = "lightgrey";
    c.ctx.fillRect(0, 0, c.width, c.height);

    // bar (actual amplitude)
    let height = (currentAmplitude / 128) * c.height;
    c.ctx.fillStyle = color.bar;
    c.ctx.fillRect(0, c.height - height, c.width, height);

    // small plate (held amplitude)
    const rectHeight = 15;
    height = (heldAmplitude / 128) * c.height;
    c.ctx.fillStyle = color.plate;
    c.ctx.fillRect(0, c.height - height, c.width, rectHeight);

    drawIndicator(color.yellow, sound.threshold.yellow);
    drawIndicator(color.green, sound.threshold.green);
}

function drawIndicator(color, position) {
    const height = 20;
    const width = 12;
    const yMiddle = c.height - (position / 128) * c.height;

    c.ctx.strokeColor = "black";
    c.ctx.strokeWidth = 2;
    c.ctx.fillStyle = color;
    c.ctx.beginPath();
    c.ctx.moveTo(c.width, yMiddle - height / 2);
    c.ctx.lineTo(c.width, yMiddle + height / 2);
    c.ctx.lineTo(c.width - width, yMiddle);
    c.ctx.closePath();
    c.ctx.fill();
    c.ctx.stroke();
}

function determineBgColor(amplitude) {
    if (amplitude > sound.threshold.green) return color.green;
    if (amplitude > sound.threshold.yellow) return color.yellow;
    return color.red;
}

function updateCanvasDimensions() {
    c.element.width = c.element.clientWidth;
    c.element.height = c.element.clientHeight;
}

document.body.addEventListener("input", (event) => {
    if (event.target.classList.contains("yellow")) {
        sound.threshold.yellow = event.target.value;
    } else if (event.target.classList.contains("green")) {
        sound.threshold.green = event.target.value;
    } else if (event.target.classList.contains("hold")) {
        sound.hold = event.target.value;
    }
});

document.querySelectorAll(".slider").forEach((input) => {
    input.dispatchEvent(new Event("input", { bubbles: true }));
});

updateCanvasDimensions();
new ResizeObserver(updateCanvasDimensions).observe(c.element);

frame();
