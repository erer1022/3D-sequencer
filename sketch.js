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
let default_duration = 1;
let currentNotePitch;
let currentChoosedBox;
let sketch3DHeight = 600;
let sketch2DHeight = 250;

const BoxSide = {
  RIGHT: 'right',
  LEFT: 'left',
  BACK: 'back',
  FRONT: 'front' // Uncomment if you want to include the front side
};

let cam1;
let azimuth;
let zenith;
let f;
let x;
let R;
let xMag;


function preload() {
  font = loadFont('./Roboto/Roboto-Black.ttf');
}


// 3D Canvas
let sketch3D = function(p) {
  p.preload = function() {
    font = p.loadFont('./Roboto/Roboto-Black.ttf');
  }
  p.setup = function() {
    p.createCanvas(p.windowWidth, sketch3DHeight, p.WEBGL).parent('3d-container'); // Create a 3D canvas
    cam1 = p.createCamera();
    p.perspective(p.PI / 3, p.width / p.height, ((p.height / 2) / p.tan(p.PI / 6)) / 10, ((p.height / 2) / p.tan(p.PI / 6)) * 100);

    // Set the initial camera position and look at a specific point
    cam1.setPosition(200, -300, 500); // Adjust the position (x, y, z) as needed
    cam1.lookAt(0, 0, 0); // Point the camera at the origin


    noteBoxSynth = new Tone.Synth();
    noteBoxSynth.oscillator.type = "sine";
    noteBoxSynth.toMaster();

    // Set colors
    boxColor = p.color(255, 227, 0, 100); // Initial color of the box
    potentialBoxColor = p.color(0, 100, 255, 100); // Semi-transparent blue for the potential box

    // -------------------------------------------- Set note duration select --------------------------------------------
    // Initialize noteDurationSelect
    noteDurationSelect = p.createSelect(); 
    noteDurationSelect.position(10, 55);
    let pNote = p.createP("note duration: ");
    pNote.position(10, 15);
    
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

    // Handle duration select change
    noteDurationSelect.changed(() => {
      if (currentChoosedBox) {
        currentChoosedBox.isChoosed = true;
        selectedDuration = parseFloat(noteDurationSelect.value());
        currentChoosedBox.duration = selectedDuration;
      }
    });


    // -------------------------------------------- Create button --------------------------------------------
    let button = p.createButton('▶︎');
    button.mousePressed(playNote);
    button.position(400, 55);

    // Add the initial box to the newBoxes array
    initialBox = new NoteBox(p.createVector(0, 0, 0), default_duration, 60); // Initialize the default box
    noteBoxes.push(initialBox);
  }

  p.draw = function() {
    p.textFont(font);
    p.background(210);

    let boxChoosed = false;
    for (let i = 0; i < noteBoxes.length; i++) {
      if (noteBoxes[i].isChoosed) {
        boxChoosed = true;
      }
    }
    // Only if no box is chosen, enable orbit control
    if (!boxChoosed) {
      p.orbitControl(3);
    }

    // -------------------------------------------- Set the camera and related argument --------------------------------------------
    // Pan: Cam rotation about y-axis (Left Right)
    azimuth = -p.atan2(cam1.eyeZ - cam1.centerZ, cam1.eyeX - cam1.centerX);
    // Tilt: Cam rotation about z-axis (Up Down)
    zenith = -p.atan2(cam1.eyeY - cam1.centerY, p.dist(cam1.eyeX, cam1.eyeZ, cam1.centerX, cam1.centerZ));
    f = p.height * 4.3 / 5;
    x = [-1, (p.mouseY - p.height / 2) / f, -(p.mouseX - p.width / 2) / f];
    R = math.multiply(Rz(-zenith), Ry(azimuth));
    x = math.multiply(x, R);
    xMag = p.dist(0, 0, 0, x._data[0], x._data[1], x._data[2]);

    // -------------------------------------------- set the duration select --------------------------------------------
    selectedDuration = parseFloat(noteDurationSelect.value());

    // -------------------------------------------- Draw all boxes --------------------------------------------
    noteBoxes.forEach(box => {
      // Always detect the latest generated box
      detectAndDrawPotentialBoxes(noteBoxes[noteBoxes.length - 1], p);
      box.drawBox(p);
    });

    // -------------------------------------------- Draw the trackBall --------------------------------------------
    for (let i = 0; i < noteBoxes.length; i++) {
      let currentBox = noteBoxes[i];
      //let moveDirection;
      //let distance;
      let currentTrackBall;
      let note_duration = convertDurationToToneJS(currentBox.duration);
      const note_duration_ms = Tone.Time(note_duration).toMilliseconds();
      //let targetPosition;
      //let nextPitch;
  
      
      if (currentBox.isActivate) {
        if (trackBalls.length < i + 1) {
          // set the trackBall move direction and move distance 
          if (noteBoxes.length > 1 && i < noteBoxes.length - 1) {
            let nextBox = noteBoxes[i + 1];
            //targetPosition = nextBox.position
            //nextPitch = nextBox.pitch;
            
            ({ moveDirection, distance } = getMoveDirectionAndDistance(currentBox, nextBox));
            currentTrackBall = new TrackBall(currentBox, nextBox, note_duration_ms / 1000, moveDirection, distance);
            
            trackBalls.push(currentTrackBall);
            
           } 
          //else {
            // Set default
            //moveDirection = BoxSide.RIGHT;
            //distance = currentBox.duration * baseWidth;
            //targetPosition = p.createVector(0, 0, 0);
            //nextPitch = 60;

          //}

          
        } else {
          trackBalls[i].updatePosition();
        }
      }
      // Only display TrackBall if it exists
      if (trackBalls[i]) {
        trackBalls[i].display(p);
      }
    }

    function getMoveDirectionAndDistance(currentBox, nextBox) {
      let moveDirection;
      let distance;
      
      if (nextBox.position.x == currentBox.position.x && nextBox.position.z < currentBox.position.z) {
        moveDirection = BoxSide.BACK;
        distance = baseWidth;
      } else if (nextBox.position.x > currentBox.position.x) {
        moveDirection = BoxSide.RIGHT;
        distance = currentBox.duration * baseWidth;
      } else if (nextBox.position.x < currentBox.position.x) {
        moveDirection = BoxSide.LEFT;
        distance = currentBox.duration * baseWidth;
      } else if (nextBox.position.x == currentBox.position.x && nextBox.position.z > currentBox.position.z) {
        moveDirection = BoxSide.FRONT;
        distance = baseWidth;
      } else {
        // Set default
        moveDirection = BoxSide.RIGHT;
        distance = currentBox.duration * baseWidth;
      }
    
      return { moveDirection, distance };
    }

    // -------------------------------------------- Draw the coordinate axes --------------------------------------------
    p.push();
    p.stroke(255, 255, 255);
    p.line(-150, 0, 0, 150, 0, 0);
    p.stroke(255, 255, 255);
    p.line(0, -150, 0, 0, 150, 0);
    p.stroke(255, 255, 255);
    p.line(0, 0, -150, 0, 0, 150);
    p.pop();
  }
  
  // Function to handle mouse clicks
  p.mousePressed = function() {
    let overDurationDropdown = isMouseOverDropdown(durationDropdown, p);
    
    // -------------------------------------------- Determine if any box is currently chosen --------------------------------------------
    currentChoosedBox = noteBoxes.find(box => box.isChoosed);
    let clickedBox = noteBoxes.find(box => box.isMouseOver(p));
    // If a box is clicked, choose it
    if (clickedBox) {
        noteBoxes.forEach(box => {
            box.isChoosed = (box === clickedBox);
        });
    } else if (!overDurationDropdown && !currentNotePitch) {
        // If the mouse click is not on a dropdown or piano key, deselect all boxes
        noteBoxes.forEach(box => {
            box.isChoosed = false;
        });
    }

    if (overDurationDropdown && currentChoosedBox) {
      currentChoosedBox.isChoosed = true;
      selectedDuration = parseFloat(noteDurationSelect.value());
      currentChoosedBox.duration = selectedDuration;
    } 

    // -------------------------------------------- define how to generate a new box --------------------------------------------
    // Check if any box is chosen
    let anyBoxChosen = noteBoxes.some(box => box.isChoosed);

    // Only handle potential box position if not interacting with dropdowns and no box is chosen
      if (!anyBoxChosen && !overDurationDropdown && !currentNotePitch) {
        if (!isOccupied(potentialBoxPosition)) {
            let newNoteBox = new NoteBox(potentialBoxPosition, default_duration, baseWidth);
            noteBoxes.push(newNoteBox);
            //detectAndDrawPotentialBoxes(newNoteBox, p);
            //potentialBoxPosition = null; // Reset potential box position
        }
    }

  }
  function isMouseOverDropdown(dropdowns, p) {
      for (let dropdown of dropdowns) {
        if (p.mouseX >= dropdown.x && p.mouseX <= dropdown.x + dropdown.width &&
            p.mouseY + sketch3DHeight / 2 >= dropdown.y && p.mouseY  + sketch3DHeight / 2 <= dropdown.y + dropdown.height) {
          return true;
        }
      }
      return false;
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

  // Function to check if the mouse is over any dropdown menu

}

let sketch2D = function(p) {
  p.preload = function() {
    font = p.loadFont('./Roboto/Roboto-Black.ttf');
  }

  p.setup = function() {
    p.createCanvas(p.windowWidth, sketch2DHeight).parent('2d-container');
    // Set the piano
    pianoSynth = new Tone.Synth();
    pianoSynth.oscillator.type = "sine";
    pianoSynth.toDestination();
    setPianoKeyboard(p);
  }

  p.draw = function() {
    p.textFont(font);
    p.background(210);
    isMouseOverKeyboard = p.mouseX >= 0 && p.mouseX <= keys.length * whiteKeyWidth && p.mouseY >= 100 && p.mouseY <= 100 + 90;
    keyboardEffects(p);
  }

  function setPianoKeyboard(p) {
    let whiteX = 200;
    let notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let numOctaves = 5; 
    let startOctave = 3; 

    for (let octave = startOctave; octave < startOctave + numOctaves; octave++) {
      for (let i = 0; i < notes.length; i++) {
        let note = notes[i];
        let isBlack = note.includes('#');
        
        if (!isBlack) {
          keys.push(new Key(note + octave, whiteX, 100, whiteKeyWidth, whiteKeyHeight, p.color(255, 255, 255)));
          whiteX += whiteKeyWidth;
        }
      }
    }

    whiteX = 200;

    for (let octave = startOctave; octave < startOctave + numOctaves; octave++) {
      for (let i = 0; i < notes.length; i++) {
        let note = notes[i];
        let isBlack = note.includes('#');
        
        if (isBlack) {
          let blackX = whiteX - blackKeyWidth / 2;
          keys.push(new Key(note + octave, blackX, 100, blackKeyWidth, blackKeyHeight, p.color(0, 0, 0)));
        }

        if (!isBlack) {
          whiteX += whiteKeyWidth;
        }
      }
    }
  }

  function keyboardEffects(p) {
    for (let key of keys) {
      if (isMouseOverKeyboard) {
        key.lighten(p);
        if (key.isMouseOver(p)) {
          key.color = p.color(147, 196, 245);
        } 
      } else {
        key.darken(p);
      }

      if (key.isActivate) {
        key.color = p.color(147, 196, 245);
      } 
      key.display(p);
    }
  }

  p.mousePressed = function() {
      currentNotePitch = clickPianoKeyboard();
      if (currentNotePitch && currentChoosedBox) {
        resetNoteBoxPitch();
      }
  }

  p.mouseReleased = function () {
    for (let key of keys) {
      key.color = key.originalColor; // Revert color when released
    }
    pianoSynth.triggerRelease();
  }

  function clickPianoKeyboard() {
    let key = getKeyUnderMouse();
    if (key) {
      pianoSynth.triggerAttack(key.note);
      return key.note;
    }
  }
  
  function getKeyUnderMouse() {
    for (let key of keys) {
      if (key.isMouseOver(p)) {
        return key;
      }
    }
    return null;
  }
}

// Create the p5 instances
new p5(sketch3D);
new p5(sketch2D);

function resetNoteBoxPitch() {
  currentChoosedBox.isChoosed = true;
  currentChoosedBox.pitch = midiNameToNumber(currentNotePitch);
}


function detectAndDrawPotentialBoxes(box, p) {
  if (box.isMouseNearBoxBackSide(p)) {
    potentialBoxPosition = generatePotentialBoxesPositions(box, BoxSide.BACK, p);
    showPotentialBox = true;
    drawPotentialBox(potentialBoxPosition, p);
  }

  if (box.isMouseNearBoxFrontSide(p)) {
    potentialBoxPosition = generatePotentialBoxesPositions(box, BoxSide.FRONT, p);
    showPotentialBox = true;
    drawPotentialBox(potentialBoxPosition, p);
  }

  if (box.isMouseNearBoxLeftSide(p)) {
    potentialBoxPosition = generatePotentialBoxesPositions(box, BoxSide.LEFT, p);
    showPotentialBox = true;
    drawPotentialBox(potentialBoxPosition, p);
  }

  if (box.isMouseNearBoxRightSide(p)) {
    potentialBoxPosition = generatePotentialBoxesPositions(box, BoxSide.RIGHT, p);
    showPotentialBox = true;
    drawPotentialBox(potentialBoxPosition, p);
  }

  if (!showPotentialBox) {
    potentialBoxPosition = null;
  }
  
  showPotentialBox = false;
}


/// Function to generate potential boxes around a given position
function generatePotentialBoxesPositions(box, side, p) {
  let potentialPosition;
  let boxWidth = baseWidth * box.duration;

  switch (side) {
    case BoxSide.RIGHT:
      potentialPosition = p.createVector(box.position.x + boxWidth, box.position.y, box.position.z);
      break;
    case BoxSide.LEFT:
      potentialPosition = p.createVector(box.position.x - boxWidth, box.position.y, box.position.z);
      break;
    case BoxSide.BACK:
      potentialPosition = p.createVector(box.position.x, box.position.y, box.position.z - baseWidth);
      break;
    case BoxSide.FRONT: // Uncomment if you want to include the front side
      potentialPosition = p.createVector(box.position.x, box.position.y, box.position.z + baseWidth);
      break;
    default:
      potentialPosition = null;
  }

  // Filter out positions that are already occupied
  if (potentialPosition && !isOccupied(potentialPosition)) {
    return potentialPosition;
  } else {
    return null;
  }
}

// Function to draw a potential box
function drawPotentialBox(position, p) {
  boxWidth = baseWidth;
  boxHeight = baseWidth;
  
  p.push();
  p.fill(potentialBoxColor);
  p.stroke(210);
  p.translate(position.x + boxWidth / 2, -boxHeight / 2, position.z - baseWidth / 2);
  p.box(baseWidth); // Default potential box size
  p.pop();
}




  

// Function to check if a position is already occupied
function isOccupied(position) {
  for (let i = 0; i < noteBoxes.length; i++) {
    let boxPos = noteBoxes[i].position.x;
    let boxWidth = noteBoxes[i].duration * baseWidth;
    if (position >= boxPos && position < boxPos + boxWidth) {
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

function Rx(th) {
  return math.matrix([
    [1, 0, 0],
    [0, Math.cos(th), -Math.sin(th)],
    [0, Math.sin(th), Math.cos(th)]
  ]);
}

function Ry(th) {
  return math.matrix([
    [Math.cos(th), 0, -Math.sin(th)],
    [0, 1, 0],
    [Math.sin(th), 0, Math.cos(th)]
  ]);
}

function Rz(th) {
  return math.matrix([
    [Math.cos(th), Math.sin(th), 0],
    [-Math.sin(th), Math.cos(th), 0],
    [0, 0, 1]
  ]);
}

