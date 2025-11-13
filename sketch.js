let osc1, osc2, osc3;
let panner1, panner2; // For binaural panning
let filter, reverb, amp, limiter; // Added a Limiter
let x, y;
let prevLeftX, prevLeftY, prevRightX, prevRightY;
let heading = 0;
let r = 128, g = 18, b = 12;
let thickness = 7;
let speed;
let startButton;
let started = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255);
  background(0);
  frameRate(4); // Good for efficiency

  startButton = createButton("Click to Start");
  startButton.position(width / 2 - 60, height / 2);
  startButton.style("font-size", "18px");
  startButton.style("padding", "10px 20px");
  startButton.mousePressed(startEverything);
}

function startEverything() {
  startButton.hide();

  x = width / 2;
  y = height / 2;
  prevLeftX = x - 10;
  prevLeftY = y;
  prevRightX = x + 10;
  prevRightY = y;
  speed = random(100);

  // --- SOUND SETUP ---
  osc1 = new p5.Oscillator('sine'); // Left Channel
  osc2 = new p5.Oscillator('sine'); // Right Channel
  osc3 = new p5.Oscillator('triangle'); // Center Drone
  osc1.start(); osc2.start(); osc3.start();
  osc1.amp(0); osc2.amp(0); osc3.amp(0);

  // Create Panners for binaural effect
  panner1 = new p5.Panner();
  panner2 = new p5.Panner();
  
  // Pan hard left and hard right
  panner1.pan(-1);
  panner2.pan(1);

  filter = new p5.LowPass();
  reverb = new p5.Reverb();
  limiter = new p5.Limiter(); // Create the Limiter
  
  // Audio Routing:
  // Oscillators -> Panners (for 1 & 2) -> Filter
  osc1.disconnect();
  osc1.connect(panner1);
  panner1.connect(filter);

  osc2.disconnect();
  osc2.connect(panner2);
  panner2.connect(filter);
  
  osc3.disconnect();
  osc3.connect(filter); // osc3 (drone) goes straight to filter

  // Filter -> Reverb
  filter.disconnect();
  filter.connect(reverb);
  reverb.drywet(0.8);
  reverb.set(6, 3);

  // Reverb -> Limiter (to prevent clipping)
  reverb.disconnect();
  reverb.connect(limiter);

  // Limiter -> Master Output
  limiter.connect();

  amp = new p5.Amplitude();
  amp.setInput(limiter); // Get level *after* the limiter

  startMeditationMusic();

  started = true;
}

function startMeditationMusic() {
  // osc3 is the low drone
  osc3.freq(midiToFreq(48), 5); // C3
  osc3.amp(0.06, 5);

  // osc1 and osc2 are the binaural pair
  let baseFreq = midiToFreq(55); // G3
  let beatFreq = 5; // 5 Hz (Theta wave)
  
  osc1.freq(baseFreq - (beatFreq / 2), 5); // Left
  osc2.freq(baseFreq + (beatFreq / 2), 5); // Right
  
  osc1.amp(0.1, 5);
  osc2.amp(0.1, 5);
  
  filter.freq(800);
  filter.res(0.4);
}

function updateMeditationMusic() {
  // Ramp time is 10 seconds. Update interval is 25s.
  let rampTime = 10;
  
  // Gently move the drone
  osc3.freq(midiToFreq(48 + random(-0.2, 0.2)), rampTime);
  osc3.amp(random(0.04, 0.06), rampTime);
  
  // Create a new, shifting binaural beat
  let baseMidiNote = random([55, 57, 59, 60]); // G, A, B, C
  let baseFreq = midiToFreq(baseMidiNote + random(-0.2, 0.2));
  let beatFreq = random(3, 7); // Shifting binaural frequency (Theta/Alpha)
  
  osc1.freq(baseFreq - (beatFreq / 2), rampTime); // Left
  osc2.freq(baseFreq + (beatFreq / 2), rampTime); // Right
  
  let newAmp = random(0.08, 0.12);
  osc1.amp(newAmp, rampTime);
  osc2.amp(newAmp, rampTime);

  // Change the filter and reverb
  filter.freq(random(400, 1000), rampTime);
  reverb.set(random(5, 8), 3, 5);
}

function draw() {
  if (!started) return;

  // --- FADE WITH BLEND MODE ---
  blendMode(BLEND);
  noStroke();
  // 3 alpha at 4 FPS = ~2 minute fade
  fill(0, 3);
  rect(0, 0, width, height);

  // --- MUSIC UPDATE ---
  // Use frameCount for reliable timing.
  // 4 frames per second * 25 seconds = 100 frames
  // This is longer than the 10-second ramp time, preventing clicks.
  if (frameCount % 100 === 0) {
    updateMeditationMusic();
  }

  // --- VISUAL LOGIC ---
  let level = amp.getLevel();
  let note = random(6 * speed);
  heading += sin(radians(frameCount % 360)) * 2 + randomGaussian() * 1;

  r += random(-10, 10);
  g += random(-10, 10);
  b += random(-10, 10);
  r = constrain(r, 0, 255);
  g = constrain(g, 0, 255);
  b = constrain(b, 0, 255);

  x += cos(radians(note)) * 80;
  y += sin(radians(note)) * 30;

  // Wrap safely
  if (x < 0) { x = width; prevLeftX += width; prevRightX += width; }
  if (x > width) { x = 0; prevLeftX -= width; prevRightX -= width; }
  if (y < 0) { y = height; prevLeftY += height; prevRightY += height; }
  if (y > height) { y = 0; prevLeftY -= height; prevRightY -= height; }

  let leftX = x + cos(radians(speed - 30)) * level;
  let leftY = y + sin(radians(note - 30)) * thickness;
  let rightX = x + cos(radians(note + 90)) * thickness;
  let rightY = y + sin(radians(speed + 90)) * level;

  fill(r, g, b);
  beginShape();
  vertex(prevLeftX, prevLeftY);
  vertex(leftX, leftY);
  vertex(rightX, rightY);
  vertex(prevRightX, prevRightY);
  endShape(CLOSE);

  prevLeftX = leftX;
  prevLeftY = leftY;
  prevRightX = rightX;
  prevRightY = rightY;

  // Reinitialize colors every 1 hour (4 fps * 3600s)
  if (frameCount % 14400 === 0) {
    r = random(255);
    g = random(255);
    b = random(255);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0); // Clear and reset background
  
  if (startButton && !started) {
    startButton.position(width / 2 - 60, height / 2);
  }

  if (started) {
    x = width / 2;
    y = height / 2;
    prevLeftX = x - 10;
    prevLeftY = y;
    prevRightX = x + 10;
    prevRightY = y;
  }
}

function keyPressed() {
  if (key === 'q') {
    osc1.stop(); osc2.stop(); osc3.stop();
    noLoop();
  }
}
