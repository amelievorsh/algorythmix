let osc1, osc2, osc3;
let filter, reverb, amp;
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
  osc1 = new p5.Oscillator('sine');
  osc2 = new p5.Oscillator('triangle');
  osc3 = new p5.Oscillator('sine');
  osc1.start(); osc2.start(); osc3.start();
  osc1.amp(0); osc2.amp(0); osc3.amp(0);

  filter = new p5.LowPass();
  osc1.disconnect(); osc2.disconnect(); osc3.disconnect();
  osc1.connect(filter);
  osc2.connect(filter);
  osc3.connect(filter);

  reverb = new p5.Reverb();
  filter.disconnect();
  filter.connect(reverb);
  reverb.drywet(0.8);
  reverb.set(6, 3);
  reverb.connect();

  amp = new p5.Amplitude();
  amp.setInput(reverb);

  startMeditationMusic();

  started = true;
}

function startMeditationMusic() {
  osc1.freq(midiToFreq(48)); // C3
  osc2.freq(midiToFreq(52)); // E3
  osc3.freq(midiToFreq(57)); // A3
  osc1.amp(0.07, 10);
  osc2.amp(0.05, 10);
  osc3.amp(0.03, 10);
  filter.freq(800);
  filter.res(0.4);
}

function updateMeditationMusic() {
  osc1.freq(midiToFreq(60 + random(-0.2, 0.2)), 10);
  osc2.freq(midiToFreq(52 + random(-0.2, 0.4)), 10);
  osc3.freq(midiToFreq(57 + random(-0.2, 0.5)), 10);
  osc1.amp(random(0.03, 0.05), 10);
  osc2.amp(random(0.04, 0.06), 10);
  osc3.amp(random(0.05, 0.07), 10);
  filter.freq(random(400, 1200), 10);
  reverb.set(random(5, 8), 3, 5);
}

function draw() {
  if (!started) return;

  // --- FADE WITH BLEND MODE ---
  blendMode(BLEND);
  noStroke();
  // 3 alpha at 4 FPS = ~2 minute fade (4fps * 120s = 480 frames)
  fill(0, 3); // <-- ADJUSTED for 2-minute fade
  rect(0, 0, width, height);

  // --- MUSIC UPDATE ---
  // Use frameCount for reliable timing
  // 4 frames per second * 10 seconds = 40 frames
  if (frameCount % 40 === 0) {
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
