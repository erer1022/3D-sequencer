let boxColor;
let potentialBoxColor;
let info = "This is a 3D Box!";
let showPotentialBox = false;
let potentialBoxPosition = null;
let noteBoxes = []; // Array to store newly created boxes with their note_duration
let potentialBoxes = []; // Array to store potential boxes
let zoomLevel = 1; // Variable to store the zoom level
let baseWidth = 60;
let boxWidth;
let boxHeight;
let note_duration = [1, 1/2, 1/4, 1/8, 1/16];
let noteDurationSelect; // Declare noteDurationSelect globally
let pitchSelect;
let selectedDuration = 1;
let selectedPitch = 60;
let synth;
let initialBox;



// Function to convert note duration to Tone.js notation
function convertDurationToToneJS(duration) {
  const durationMap = {
    '1': "1n",
    '1/2': "2n",
    '1/4': "4n",
    '1/8': "8n",
    '1/16': "16n"
  };
  return durationMap[duration.toString()];
}

// Function to convert MIDI note number to note name
function midiNoteToNoteName(noteNumber) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(noteNumber / 12) - 1;
  const noteIndex = noteNumber % 12;
  return noteNames[noteIndex] + octave;
}

function setup() {
  createCanvas(800, 800, WEBGL);
  synth = new Tone.Synth().toDestination();
  
  boxColor = color(255, 227, 0, 100); // Initial color of the box
  potentialBoxColor = color(0, 100, 255, 100); // Semi-transparent blue for the potential box
  
  noteDurationSelect = createSelect(); // Initialize noteDurationSelect
  noteDurationSelect.position(10, 55);
  let p = createP("note duration: ");
  p.position(10, 15);
  pitchSelect = createSelect();
  pitchSelect.position(200, 55);
  let p2 = createP("note pitch: ");
  p2.position(200, 15);
  
  // Add duration to dropdown options.
  for (let duration of note_duration) {
    noteDurationSelect.option(duration);
  }
  // Set the default value
  noteDurationSelect.selected(note_duration[0]); 
  
  for (let i = 1; i < 128; i++) {
    pitchSelect.option(i); // Add options to the select
  }
  // Set the default value
  pitchSelect.selected(60);

  // Initialize potential boxes around the original box
  potentialBoxes = generatePotentialBoxes(createVector(0, 0, 0));

  let button = createButton('▶︎');
  button.mousePressed(playNote);
  button.position(400, 55);

  // Add the initial box to the newBoxes array
  initialBox = new NoteBox(createVector(0, 0, 0), 1, 60); // Initialize the default box
  noteBoxes.push(initialBox);
}

function draw() {
  background(200);
  
  // Apply zoom
  scale(zoomLevel);
  
  rotateX(-PI / 10);
  rotateY(PI / 10);
  
  // Update the initial box based on the selected values
  initialBox.duration = parseFloat(noteDurationSelect.value());
  initialBox.pitch = parseFloat(pitchSelect.value());

  // Draw all new boxes
  noteBoxes.forEach(box => {
    console.log(`duration: ${box.duration} pitch: ${box.pitch}`);
    box.drawBox(baseWidth, color(80, 108, 207));
  });
  
  
  // Draw all potential boxes
  potentialBoxes.forEach(pos => {
    if (isMouseNearBox(pos)) {
      showPotentialBox = true;
      potentialBoxPosition = pos;
      drawPotentialBox(pos);
    }
  });
  
  if (!showPotentialBox) {
    potentialBoxPosition = null;
  }
  
  showPotentialBox = false;
}

// Function to generate potential boxes around a given position
function generatePotentialBoxes(position) {
  if (noteDurationSelect) { // Check if noteDurationSelect is defined
    selectedDuration = parseFloat(noteDurationSelect.value()); // Get the selected value
  }

  let potentialPositions = [];

  if (selectedDuration === 1) {
     potentialPositions = [
        createVector(position.x - baseWidth * selectedDuration, position.y, position.z), // Left side
        createVector(position.x + baseWidth * selectedDuration, position.y, position.z), // Right side
      ];
  } else if (selectedDuration === 1/2){
     potentialPositions = [
        createVector(position.x - baseWidth * selectedDuration / 2, position.y, position.z), // Left side
        createVector(position.x + baseWidth * selectedDuration / 2, position.y, position.z), // Right side
      ];
  } else if (selectedDuration === 1/4){
     potentialPositions = [
        createVector(position.x - baseWidth * selectedDuration / 4, position.y, position.z), // Left side
        createVector(position.x + baseWidth * selectedDuration / 4, position.y, position.z), // Right side
      ];
  } else if (selectedDuration === 1/8){
     potentialPositions = [
        createVector(position.x - baseWidth * selectedDuration / 8, position.y, position.z), // Left side
        createVector(position.x + baseWidth * selectedDuration / 8, position.y, position.z), // Right side
      ];
  } else {
     potentialPositions = [
        createVector(position.x - baseWidth * selectedDuration / 16, position.y, position.z), // Left side
        createVector(position.x + baseWidth * selectedDuration / 16, position.y, position.z), // Right side
      ];
  }
  // Filter out positions that are already occupied
  return potentialPositions.filter(pos => !isOccupied(pos));
}

// Function to draw a potential box
function drawPotentialBox(position) {
  if (noteDurationSelect) { // Check if noteDurationSelect is defined
    selectedDuration = parseFloat(noteDurationSelect.value()); // Get the selected value
  }
  
  if (pitchSelect) { // Check if noteDurationSelect is defined
    selectedPitch = parseFloat(pitchSelect.value()); // Get the selected value
  }
  boxWidth = baseWidth * selectedDuration;
  boxHeight = selectedPitch;
  
  
  push();
  fill(potentialBoxColor);
  stroke(210);
  translate(position.x, -boxHeight / 2, position.z);
  box(boxWidth, boxHeight, baseWidth); // Default potential box size
  pop();
}

// Function to check if the mouse is near a box
function isMouseNearBox(position) {
  if (noteDurationSelect) { // Check if noteDurationSelect is defined
    selectedDuration = parseFloat(noteDurationSelect.value()); // Get the selected value
  }
  let mouseX3D = mouseX - width / 2;
  let mouseY3D = mouseY - height / 2;
  let dx = mouseX3D - position.x;
  let dy = mouseY3D - position.y;
  let distance = sqrt(dx * dx + dy * dy);
  return distance < baseWidth * selectedDuration;
}

// Function to handle mouse clicks
function mousePressed() {
  if (potentialBoxPosition) {
    if (noteDurationSelect) { // Check if noteDurationSelect is defined
      selectedDuration = parseFloat(noteDurationSelect.value()); // Get the selected value
    }
    
  if (pitchSelect) { // Check if noteDurationSelect is defined
    selectedPitch = parseFloat(pitchSelect.value()); // Get the selected value
  }
    newNoteBox = new NoteBox(potentialBoxPosition, selectedDuration, selectedPitch);
    noteBoxes.push(newNoteBox);
    potentialBoxes = potentialBoxes.concat(generatePotentialBoxes(potentialBoxPosition));
    potentialBoxPosition = null; // Reset potential box position
  }
}

// Function to check if a position is already occupied
function isOccupied(position) {
  for (let i = 0; i < noteBoxes.length; i++) {
    let boxPos = noteBoxes[i].position;
    if (boxPos.equals(position)) {
      return true;
    }
  }
  return false;
}

// Function to handle mouse wheel for zooming
function mouseWheel(event) {
  // Zoom in and out
  zoomLevel += event.delta * -0.001; // Adjust the zoom level based on the scroll amount
  zoomLevel = constrain(zoomLevel, 0.5, 2); // Constrain the zoom level to prevent it from getting too close or too far
}

// Function to display information when mouse is over the box
function displayInfo() {
  fill(0);
  textSize(24);
  textAlign(CENTER, CENTER);
  text(info, 0, -150);
}

function playNote(){
    const now = Tone.now();
    let currentTime = now;

    noteBoxes.forEach(box => {
      note_name = midiNoteToNoteName(box.pitch);
      note_duration = convertDurationToToneJS(box.duration);
      synth.triggerAttackRelease(note_name, note_duration, currentTime);
      console.log(`note_name: ${note_name} note_duration: ${note_duration} currentTime: ${currentTime}`);
    })
}