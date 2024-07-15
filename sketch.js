let boxColor;
let potentialBoxColor;
let info = "This is a 3D Box!";
let showPotentialBox = false;
let potentialBoxPosition = null;
let noteBoxes = []; // Array to store newly created boxes with their note_duration
let potentialBoxes = []; // Array to store potential boxes
let trackBalls = [];
let zoomLevel = 1; // Variable to store the zoom level
let baseWidth = 60;
let boxWidth;
let boxHeight;
let note_duration = [1, 1/2, 1/4, 1/8, 1/16];
let noteDurationSelect; // Declare noteDurationSelect globally
let pitchSelect;
let durationDropdown = [];
let pitchDropdown = [];
let selectedDuration = 1;
let selectedPitch = 60;
let synth;
let initialBox;
let rotateAngle;




function setup() {
  createCanvas(800, 800, WEBGL);
  synth = new Tone.Synth().toDestination();
  
  boxColor = color(255, 227, 0, 100); // Initial color of the box
  potentialBoxColor = color(0, 100, 255, 100); // Semi-transparent blue for the potential box
  
  noteDurationSelect = createSelect(); // Initialize noteDurationSelect
  noteDurationSelect.position(10, 55);
  let p = createP("note duration: ");
  p.position(10, 15);
  // Wait until the DOM is updated
  setTimeout(() => {
    durationDropdown.push({
      x: noteDurationSelect.elt.offsetLeft,
      y: noteDurationSelect.elt.offsetTop,
      width: noteDurationSelect.elt.offsetWidth,
      height: noteDurationSelect.elt.offsetHeight,
    });
  }, 100);

  pitchSelect = createSelect();
  pitchSelect.position(200, 55);
  let p2 = createP("note pitch: ");
  p2.position(200, 15);
  // Wait until the DOM is updated
  setTimeout(() => {
    pitchDropdown.push({
      x: pitchSelect.elt.offsetLeft,
      y: pitchSelect.elt.offsetTop,
      width: pitchSelect.elt.offsetWidth,
      height: pitchSelect.elt.offsetHeight
    });
  }, 100);
  
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
  
  rotateAngle = PI / 10;
  rotateX(-rotateAngle);
  rotateY(rotateAngle);
  
  
  selectedDuration = parseFloat(noteDurationSelect.value());
  selectedPitch = parseFloat(pitchSelect.value());

  // Draw all new boxes
  noteBoxes.forEach(box => {
    if (box.isChoosed) {
        box.duration = selectedDuration;
        box.pitch = selectedPitch;
    }
    box.drawBox(baseWidth);
  });

  if (noteBoxes.length == 1) {
    // Initialize potential boxes around the original box
    potentialBoxes = generatePotentialBoxes(noteBoxes[0]);
  }
  
  
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


  for (let i = 0; i < noteBoxes.length; i++) {
    let currentBox = noteBoxes[i];
    let distance = noteBoxes[i].duration * baseWidth;
    let currentTrackBall;
    const note_duration = convertDurationToToneJS(currentBox.duration);
    const note_duration_ms = Tone.Time(note_duration).toMilliseconds();
    
    if (currentBox.isActivate) {
        if (trackBalls.length < i + 1){
            currentTrackBall = new TrackBall(currentBox.position, currentBox.pitch, distance, note_duration_ms / 1000);
            trackBalls.push(currentTrackBall);
        } else {
            trackBalls[i].updatePosition();
        }
    }
    // Only display TrackBall if it exists
  if (trackBalls[i]) {
    trackBalls[i].display();
  }
  }
}

// Function to generate potential boxes around a given position
function generatePotentialBoxes(box) {
  if (noteDurationSelect) { // Check if noteDurationSelect is defined
    selectedDuration = parseFloat(noteDurationSelect.value()); // Get the selected value
  }

  let potentialPositions = [];
  let boxWidth = baseWidth * box.duration

  potentialPositions = [
    createVector(box.position.x + boxWidth, box.position.y, box.position.z), // Right side
  ];
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
  translate(position.x + boxWidth / 2, -boxHeight / 2, position.z);
  box(boxWidth, boxHeight, baseWidth); // Default potential box size
  pop();
}

// Function to check if the mouse is near a box
function isMouseNearBox(position) {
  let mouseX3D = mouseX - width / 2;
  let mouseY3D = mouseY - height / 2;
  let dx = mouseX3D - position.x;
  let dy = mouseY3D - position.y;
  let distance = sqrt(dx * dx + dy * dy);
  return distance < baseWidth * selectedDuration;
}

// Function to check if the mouse is hovering over a box in 3D space
function isMouseHoverBox(box) {
    // Calculate the 3D coordinates of the mouse
    let mouseX3D = mouseX - width / 2;
    let mouseY3D = mouseY - height / 2;
  
    // Calculate the distance from the mouse to the center of the box in the X and Y dimensions
    let dx = mouseX3D - box.position.x;
    let dy = mouseY3D - box.position.y;
  
    // Since we are dealing with 3D, we need to include the Z dimension
    // Assuming the box is aligned with the Z-axis, we need to check the Z position too
    let dz = 0 - box.position.z; // If you have a different Z position for the mouse, adjust this accordingly
  
    // Check if the mouse is within the bounds of the box in all three dimensions
    let boxWidth = baseWidth * box.duration;
    let boxHeight = box.pitch;
    let boxDepth = baseWidth;
  
    let withinX = abs(dx) < boxWidth / 2;
    let withinY = abs(dy) < boxHeight / 2;
    let withinZ = abs(dz) < boxDepth / 2;
  
    return withinX && withinY && withinZ;
  }


// Function to check if the mouse is over any dropdown menu
function isMouseOverDropdown(dropdowns) {
    for (let dropdown of dropdowns) {
      if (mouseX >= dropdown.x && mouseX <= dropdown.x + dropdown.width &&
          mouseY >= dropdown.y && mouseY <= dropdown.y + dropdown.height) {
        return true;
      }
    }
    return false;
  }

// Function to handle mouse clicks
function mousePressed() {
    let overDurationDropdown = isMouseOverDropdown(durationDropdown);
    let overPitchDropdown = isMouseOverDropdown(pitchDropdown);
  
    if (overDurationDropdown) {
      selectedDuration = parseFloat(noteDurationSelect.value());
      noteBoxes.forEach(box => {
        if (box.isChoosed) {
          box.duration = selectedDuration;
        }
      });
    } else if (overPitchDropdown) {
      selectedPitch = parseFloat(pitchSelect.value());
      noteBoxes.forEach(box => {
        if (box.isChoosed) {
          box.pitch = selectedPitch;
        }
      });
    }
  
    // Handle box selection regardless of dropdown interaction
    noteBoxes.forEach(box => {
        if (isMouseHoverBox(box)) {
          box.isChoosed = true;
        } else {
          box.isChoosed = false;
        }
      });
      
    // Check if any box is chosen
    let anyBoxChosen = noteBoxes.some(box => box.isChoosed);
  
    // Only handle potential box position if not interacting with dropdowns and no box is chosen
    if (!anyBoxChosen && !overDurationDropdown && !overPitchDropdown && potentialBoxPosition) {
      if (!isOccupied(potentialBoxPosition)) {
        let newNoteBox = new NoteBox(potentialBoxPosition, selectedDuration, selectedPitch);
        noteBoxes.push(newNoteBox);
        potentialBoxes = generatePotentialBoxes(newNoteBox);
        potentialBoxPosition = null; // Reset potential box position
      }
    }
  
    
  
    // // Clear potential boxes if any box is chosen
    // if (anyBoxChosen) {
    //   potentialBoxes = [];
    // }
  }

// Function to check if a position is already occupied
function isOccupied(position) {
  for (let i = 0; i < noteBoxes.length; i++) {
    let boxPos = noteBoxes[i].position.x;
    let boxWidth = noteBoxes[i].duration * baseWidth;
    //console.log(`boxPos: ${boxPos} boxRange:${boxPos - boxWidth / 2} - ${boxPos + boxWidth / 2}`);
    if (position >= boxPos - boxWidth / 2 && position < boxPos + boxWidth / 2) {
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

function playNote() {
    // reset the trackBalls
    trackBalls = [];
    const now = Tone.now();
    let currentTime = now;

    noteBoxes.forEach(box => {
        const note_name = midiNoteToNoteName(box.pitch);
        const note_duration = convertDurationToToneJS(box.duration);
        const note_duration_ms = Tone.Time(note_duration).toMilliseconds();
        
        // Schedule the note to be played at the correct time
        synth.triggerAttackRelease(note_name, note_duration, currentTime);

        // Schedule the activation of the box
        setTimeout(() => {
            box.isActivate = true;
        }, (currentTime - now) * 1000);

        // Schedule the deactivation of the box
        setTimeout(() => {
            box.isActivate = false;
        }, (currentTime - now) * 1000 + note_duration_ms);

        // Increment the currentTime by the duration of the note
        currentTime += Tone.Time(note_duration).toSeconds();
    });
}

// Helper function to convert Tone.js duration to milliseconds
Tone.Time.prototype.toMilliseconds = function() {
    return this.toSeconds() * 1000;
}

// Function to convert note duration to Tone.js notation
function convertDurationToToneJS(duration) {
    const durationMap = {
      '1': "1n",
      '0.5': "2n",
      '0.25': "4n",
      '0.125': "8n",
      '0.0625': "16n"
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