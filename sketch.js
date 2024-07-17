let font;
let boxColor;
let potentialBoxColor;
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
let durationDropdown = [];
let selectedDuration = 1;
let pianoSynth;
let noteBoxSynth;
let initialBox;
let rotateAngle;
let keys = [];
let isMouseOverKeyboard = false;
let whiteKeyWidth = 30;
let blackKeyWidth = 18;
let whiteKeyHeight = 90;
let blackKeyHeight = 50;
let selectedBox = null;

function preload() {
  font = loadFont('./Roboto/Roboto-Black.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
    pianoSynth = new Tone.Synth();
    pianoSynth.oscillator.type = "sine";
    pianoSynth.toMaster();

    noteBoxSynth = new Tone.Synth();
    noteBoxSynth.oscillator.type = "sine";
    noteBoxSynth.toMaster();

  setPianoKeyboard();
  
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
  
  // Add duration to dropdown options.
  for (let duration of note_duration) {
    noteDurationSelect.option(duration);
  }
  // Set the default value
  noteDurationSelect.selected(note_duration[0]); 

  
  let button = createButton('▶︎');
  button.mousePressed(playNote);
  button.position(400, 55);

  // Add the initial box to the newBoxes array
  initialBox = new NoteBox(createVector(0, 0, 0), 1, 60); // Initialize the default box
  noteBoxes.push(initialBox);
}

function draw() {
  textFont(font);
  background(200);
  
  isMouseOverKeyboard = mouseX - width / 2 >= -300 && mouseX - width / 2 <= -300 + keys.length * whiteKeyWidth && mouseY - height / 2 >= 300 && mouseY-height/2 <= 90 + 300;
  keyboardEffects();

  // Apply zoom
  scale(zoomLevel);
  
  rotateAngle = PI / 10;
  rotateX(-rotateAngle);
  rotateY(rotateAngle);

  selectedDuration = parseFloat(noteDurationSelect.value());

  // Draw all new boxes
  noteBoxes.forEach(box => {
    box.drawBox();
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

function setPianoKeyboard() {
let whiteX = 0;
let notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
let numOctaves = 3; 
let startOctave = 3; 

for (let octave = startOctave; octave < startOctave + numOctaves; octave++) {
  for (let i = 0; i < notes.length; i++) {
    let note = notes[i];
    let isBlack = note.includes('#');
    
    if (!isBlack) {
      keys.push(new Key(note + octave, whiteX - 300, 300, whiteKeyWidth, whiteKeyHeight, '#fffff0'));
      whiteX += whiteKeyWidth;
    }
  }
}

whiteX = 0;

for (let octave = startOctave; octave < startOctave + numOctaves; octave++) {
  for (let i = 0; i < notes.length; i++) {
    let note = notes[i];
    let isBlack = note.includes('#');
    
    if (isBlack) {
      let blackX = whiteX - blackKeyWidth / 2;
      keys.push(new Key(note + octave, blackX - 300, 300, blackKeyWidth, blackKeyHeight, 'black'));
    }

    if (!isBlack) {
      whiteX += whiteKeyWidth;
    }
  }
}
}

function keyboardEffects() {
  for (let key of keys) {
    if (isMouseOverKeyboard) {
      key.lighten();
      if (key.isMouseOver()) {
        key.color = color(147, 196, 245);
       // key.stroke = (255, 255, 255);
      } 
    } else {
      key.darken();
    }

    if (key.isActivate) {
      key.color = color(147, 196, 245);
    } 
    key.display();
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
  
  boxWidth = baseWidth * selectedDuration;
  boxHeight = baseWidth;
  
  push();
  fill(potentialBoxColor);
  stroke(210);
  translate(position.x + boxWidth / 2, -boxHeight / 2, position.z);
  box(baseWidth); // Default potential box size
  pop();
}

// Function to check if the mouse is near a box
function isMouseNearBox(position) {
  let mouseX3D = mouseX - width / 2;
  let mouseY3D = mouseY - height / 2;
  let dx = mouseX3D - position.x;
  let dy = mouseY3D - position.y;
  let distance = sqrt(dx * dx + dy * dy);
  return distance < baseWidth * selectedDuration / 2;
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
  let note_pitch = clickPianoKeyboard();
  let overDurationDropdown = isMouseOverDropdown(durationDropdown);

  // Determine if any box is currently chosen
  let currentChoosedBox = noteBoxes.find(box => box.isChoosed);
  // Check if a box is clicked
  let clickedBox = noteBoxes.find(box => box.isMouseOver());
  // If a box is clicked, choose it
  if (clickedBox) {
      noteBoxes.forEach(box => {
          box.isChoosed = (box === clickedBox);
      });
  } else if (!overDurationDropdown && !note_pitch) {
      // If the mouse click is not on a dropdown or piano key, deselect all boxes
      noteBoxes.forEach(box => {
          box.isChoosed = false;
      });
  }

  // If a box is already chosen and clicked on a dropdown or piano key, keep it chosen
  if (currentChoosedBox && (overDurationDropdown || note_pitch)) {
      currentChoosedBox.isChoosed = true;
  }

  
  if (overDurationDropdown) {
    selectedDuration = parseFloat(noteDurationSelect.value());
    currentChoosedBox.duration = selectedDuration;
  } else if (note_pitch) {
    currentChoosedBox.pitch = midiNameToNumber(note_pitch);
  }

  // Check if any box is chosen
  let anyBoxChosen = noteBoxes.some(box => box.isChoosed);

  // Only handle potential box position if not interacting with dropdowns and no box is chosen
  if (!anyBoxChosen && !overDurationDropdown && potentialBoxPosition) {
      if (!isOccupied(potentialBoxPosition)) {
          let newNoteBox = new NoteBox(potentialBoxPosition, 1, baseWidth);
          noteBoxes.push(newNoteBox);
          potentialBoxes = generatePotentialBoxes(newNoteBox);
          potentialBoxPosition = null; // Reset potential box position
      }
  }
}


  function clickPianoKeyboard() {
    let key = getKeyUnderMouse();
    if (key) {
      pianoSynth.triggerAttack(key.note);
      return key.note;
    }
  }

  function mouseReleased() {
    for (let key of keys) {
      key.color = key.originalColor; // Revert color when released
    }
    pianoSynth.triggerRelease();
  }

  function getKeyUnderMouse() {
    for (let key of keys) {
      if (key.isMouseOver()) {
        return key;
      }
    }
    return null;
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

function playNote() {
  // reset the trackBalls
  trackBalls = [];
  const now = Tone.now();
  let currentTime = now;

  noteBoxes.forEach(box => {
      const note_pitch = midiNoteToNoteName(box.pitch);
      const note_duration = convertDurationToToneJS(box.duration);
      const note_duration_ms = Tone.Time(note_duration).toMilliseconds();

      // Schedule the note to be played at the correct time
      noteBoxSynth.triggerAttackRelease(note_pitch, note_duration, currentTime);

      // Schedule the activation of the box and the corresponding key
      setTimeout(() => {
          box.isActivate = true;
          for (let key of keys) {
              if (midiNameToNumber(key.note) == box.pitch) {
                  key.isActivate = true;
              }
          }
      }, (currentTime - now) * 1000);

      // Schedule the deactivation of the box and the corresponding key
      setTimeout(() => {
          box.isActivate = false;
          for (let key of keys) {
              if (midiNameToNumber(key.note) == box.pitch) {
                  key.isActivate = false;
              }
          }
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

  function midiNameToNumber(midiName) {
    const noteToNumber = {
        'C': 0,
        'C#': 1, 'Db': 1,
        'D': 2,
        'D#': 3, 'Eb': 3,
        'E': 4,
        'F': 5,
        'F#': 6, 'Gb': 6,
        'G': 7,
        'G#': 8, 'Ab': 8,
        'A': 9,
        'A#': 10, 'Bb': 10,
        'B': 11
    };

    const note = midiName.slice(0, -1); // Extract note part (e.g., "C" from "C4")
    const octave = parseInt(midiName.slice(-1)); // Extract octave part (e.g., "4" from "C4")

    if (noteToNumber[note] !== undefined && !isNaN(octave)) {
        return (octave + 1) * 12 + noteToNumber[note];
    } else {
        throw new Error("Invalid MIDI note name");
    }
}