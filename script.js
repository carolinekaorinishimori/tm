const URL_INPUT = document.getElementById('model-url');
const START_BTN = document.getElementById('start-btn');
const WEBCAM_CONTAINER = document.getElementById('webcam-container');
const LABEL_CONTAINER = document.getElementById('label-container');

let model, webcam, maxPredictions;
let isPlaying = false;

START_BTN.addEventListener('click', async () => {
    let url = URL_INPUT.value.trim();
    
    if (!url) {
        alert("Please enter a valid Teachable Machine Model URL");
        return;
    }
    
    if (!url.endsWith('/')) {
        url += '/';
    }

    try {
        START_BTN.disabled = true;
        START_BTN.textContent = 'Loading Model...';
        
        await init(url);
        
        START_BTN.textContent = 'Running';
    } catch (error) {
        console.error("Error loading model:", error);
        alert("Failed to load the model. Please check the URL and your connection.");
        START_BTN.disabled = false;
        START_BTN.textContent = 'Initialize Camera & Model';
    }
});

async function init(URL) {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // load the model and metadata
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    webcam = new tmImage.Webcam(400, 400, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    isPlaying = true;
    window.requestAnimationFrame(loop);

    // append elements to the DOM
    WEBCAM_CONTAINER.innerHTML = ""; // Clear placeholder
    WEBCAM_CONTAINER.appendChild(webcam.canvas);
    
    LABEL_CONTAINER.innerHTML = ""; // Clear existing labels
    for (let i = 0; i < maxPredictions; i++) {
        const div = document.createElement("div");
        div.className = "label-item";
        
        const nameSpan = document.createElement("span");
        nameSpan.className = "label-name";
        
        const valSpan = document.createElement("span");
        valSpan.className = "label-value";
        
        div.appendChild(nameSpan);
        div.appendChild(valSpan);
        LABEL_CONTAINER.appendChild(div);
    }
}

async function loop() {
    if (!isPlaying) return;
    
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

// run the webcam image through the image model
async function predict() {
    // predict can take in an image, video or canvas html element
    const prediction = await model.predict(webcam.canvas);
    
    for (let i = 0; i < maxPredictions; i++) {
        const item = LABEL_CONTAINER.childNodes[i];
        const prob = prediction[i].probability;
        const probPerc = (prob * 100).toFixed(1);
        
        item.style.setProperty('--progress', `${probPerc}%`);
        item.querySelector('.label-name').textContent = prediction[i].className;
        item.querySelector('.label-value').textContent = `${probPerc}%`;
    }
}
