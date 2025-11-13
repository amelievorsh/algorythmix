// --- AUDIO + VISUAL VARIABLES ---
let osc1, osc2, osc3;
let filter, reverb, amp;

let x, y;
let prevLeftX, prevLeftY, prevRightX, prevRightY;
let r = 128, g = 18, b = 12;
let thickness = 7;
let speed;

let startButton;
let started = false;

// --- TIMERS FOR SAFE LONG-TERM RUNTIME ---
let lastMusicUpdate = 0;
let cycleStart = 0;
const cycleLength = 180000; // 3 minutes

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255);
  background(0);
  frameRate(4);

  startButton = createButton("Click to Start");
  startButton.position(width/2 - 60, height/2);
  startButton.style("font-size", "18px");
  startButton.style("padding", "10px 20px");
  startButton.mousePressed(startEverything);
}

function startEverything() {
  startButton.hide();
  startNewCycle();   // <-- SAFE cycle initialization
  started = true;
}

// --- Reset EVERYTHING every 3 minutes ---
function startNewCycle() {
  background(0);

  // Init visual positions
  x = width / 2;
  y = height / 2;
  prevLeftX = x - 10;
  prevLeftY = y;
  prevRightX = x + 10;
  prevRightY = y;
  speed = random(100);

  // SAFELY destroy old audio if they exist
  if (osc1) osc1.stop();
  if (osc2) osc2.stop();
  if (osc3) osc3.stop();
  if (filter) filter.disconnect();
  if (reverb) reverb.disconnect();

  // Completely rebuild audio chain
  osc1 = new p5.Oscillator('sine');
  osc2 = new p5.Oscillator('triangle');
  osc3 = new p5.Oscillator('sine');

  osc1.start(); osc2.start(); osc3.start();
  osc1.amp(0);  osc2.amp(0);  osc3.amp(0);

  filter = new p5.LowPass();
  osc1.connect(filter);
  osc2.connect(filter);
  osc3.connect(filter);

  reverb = new p5.Reverb();
  filter.connect(reverb);
  reverb.drywet(0.8);
  reverb.set(6, 3);
  reverb.connect();

  amp = new p5.Amplitude();
  amp.setInput(reverb);

  startMeditationMusic();

  // Reset timers
  lastMusicUpdate = millis();
  cycleStart = millis();
}

// --- Soft ambient chord state ---
function startMeditationMusic() {
  osc1.freq(midiToFreq(48));
  osc2.freq(midiToFreq(52));
  osc3.freq(midiToFreq(57));

  osc1.amp(0.07, 5);
  osc2.amp(0.05, 5);
  osc3.amp(0.03, 5);

  filter.freq(800);
  filter.res(0.4);
}

function updateMeditationMusic() {
  let drift1 = random(-0.2, 0.2);
  let drift2 = random(-0.2, 0.4);
  let drift3 = random(-0.2, 0.5);

  osc1.freq(midiToFreq(60 + drift1), 10);
  osc2.freq(midiToFreq(52 + drift2), 10);
  osc3.freq(midiToFreq(57 + drift3), 10);

  osc1.amp(random(0.03, 0.05), 10);
  osc2.amp(random(0.04, 0.06), 10);
  osc3.amp(random(0.05, 0.07), 10);

  filter.freq(random(400, 1200), 10);
}

function draw() {
  if (!started) return;

  let now = millis();

  // --- 3-minute fade-to-black ---
  let progress = (now - cycleStart) / cycleLength;
  let fadeStrength = map(progress, 0, 1, 2, 40);  // stronger at end
  fill(0, fadeStrength);
  noStroke();
  rect(0, 0, width, height);

  // --- MUSIC UPDATE every 10 seconds ---
  if (now - lastMusicUpdate > 10000) {
    updateMeditationMusic();
    lastMusicUpdate = now;
  }

  // --- RESTART EVERYTHING after 3 minutes ---
  if (now - cycleStart > cycleLength) {
    startNewCycle();
    return;
  }

  // --- VISUALS ---
  let level = amp.getLevel();
  let note = random(6 * speed);

  r += random(-10, 10);
  g += random(-10, 10);
  b += random(-10, 10);
  r = constrain(r, 0, 255);
  g = constrain(g, 0, 255);
  b = constrain(b, 0, 255);

  x += cos(radians(note)) * 80;
  y += sin(radians(note)) * 30;

  if (x < 0) { x = width; }
  if (x > width) { x = 0; }
  if (y < 0) { y = height; }
  if (y > height) { y = 0; }

  let leftX  = x + cos(radians(speed - 30)) * level;
  let leftY  = y + sin(radians(note - 30)) * thickness;
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
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
