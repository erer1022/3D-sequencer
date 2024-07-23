let font;
let pianoSynth;
let noteBoxSynth;
let initialBox;
let currentNotePitch;
let currentNoteDuration;
let currentChoosedBox;
let defaultTrackBall;

let default_duration = 1;
let trackBallBase = 20;
let zoomLevel = 1; // Variable to store the zoom level
let baseWidth = 60;
let whiteKeyWidth = 30;
let blackKeyWidth = 18;
let whiteKeyHeight = 90;
let blackKeyHeight = 50;
let sketch3DHeight = 700;
let sketch2DHeight = 150;

let potentialBoxPosition = null;

let noteBoxes = []; // Array to store newly created boxes with their note_duration
let potentialBoxes = []; // Array to store potential boxes
let trackBalls = [];
let keys = [];
let noteDurations = [];
let note_duration = [1, 1/2, 1/4, 1/8, 1/16];

let isMouseOverKeyboard = false;
let showPotentialBox = false;

// camera arguments
let cam1;
let azimuth;
let zenith;
let f;
let x;
let R;
let xMag;

const BoxSide = {
  RIGHT: 'right',
  LEFT: 'left',
  BACK: 'back',
  FRONT: 'front' // Uncomment if you want to include the front side
};

function preload() {
  font = loadFont('./Roboto/Roboto-Black.ttf');
}

// 3D Canvas
let sketch3D = function(p) {
  p.preload = function() {
    font = p.loadFont('./Roboto/Roboto-Black.ttf');
  }
  p.setup = function() {
    // basic setting
    p.createCanvas(p.windowWidth, sketch3DHeight, p.WEBGL).parent('3d-container'); // Create a 3D canvas
    
    cam1 = p.createCamera();
    p.perspective(p.PI / 3, p.width / p.height, ((p.height / 2) / p.tan(p.PI / 6)) / 10, ((p.height / 2) / p.tan(p.PI / 6)) * 100);
    // Set the initial camera position and look at a specific point
    cam1.setPosition(200, -300, 500); // Adjust the position (x, y, z) as needed
    cam1.lookAt(0, 0, 0); // Point the camera at the origin

    // set the tone.synth
    noteBoxSynth = new Tone.Synth();
    noteBoxSynth.oscillator.type = "sine";
    noteBoxSynth.toMaster();

    // -------------------------------------------- Create button --------------------------------------------
    let playButton = p.createButton('▶︎');
    playButton.mousePressed(playNote);
    playButton.position(1300, 105);

    let deleteButton = p.createButton('Delete note box 📦');
    deleteButton.mousePressed(deleteLatestBox);
    deleteButton.position(1300, 165);

    // -------------------------------------------- set the initial box --------------------------------------------
    initialBox = new NoteBox(p.createVector(0, 0, 0), default_duration, 60); // Initialize the default box
    noteBoxes.push(initialBox);
  }

  p.draw = function() {
    p.textFont(font);
    p.background(210);
    setCameraArguments(p);

    // -------------------------------------------- set the orbit control --------------------------------------------
    // Only if no box is chosen, enable orbit control
    let boxChoosed = false;
    for (let i = 0; i < noteBoxes.length; i++) {
      if (noteBoxes[i].isChoosed) {
        boxChoosed = true;
      }
    }
    if (!boxChoosed) {
      p.orbitControl(3);
    }

    // -------------------------------------------- Draw the trackBall --------------------------------------------
    setDefaultTrackBall(p);

    // -------------------------------------------- Draw 3D "note durations selectors" --------------------------------------------
    if (currentChoosedBox) {
      // for each choosed box, reset noteDuraions
      noteDurations = [];
      noteDurations = setNoteDurations(currentChoosedBox);

      for (let duration of noteDurations) {
        duration.display(p);
      }
    }

    // -------------------------------------------- Draw the coordinate axes --------------------------------------------
    drawCoordinate(p);
  }

  function setDefaultTrackBall(p) {
    for (let i = 0; i < noteBoxes.length; i++ ){
      // for each track, set 1 trackball
      let currentBox = noteBoxes[i];
      let note_duration = convertDurationToToneJS(currentBox.duration);
      let note_duration_ms = Tone.Time(note_duration).toMilliseconds();
      let nextBox;
      let moveDirection;

      if (!defaultTrackBall) {
        defaultTrackBall = new TrackBall(p.createVector(0, 0, 0));
      }

      if (i < noteBoxes.length - 1) {
        nextBox = noteBoxes[i + 1];
        if (currentBox.isActivate ) {
          moveDirection = getMoveDirection(currentBox, nextBox);
          defaultTrackBall.updatePosition(currentBox, nextBox, moveDirection, note_duration_ms / 1000);
        }
      }
        defaultTrackBall.display(p);
    }
  }

  function setNoteDurations(currentChoosedBox) {
    let noteDurations = [];
    for (let i = 0; i < note_duration.length; i++){
      noteDurations.push(new NoteDuration(note_duration[i], currentChoosedBox));
    } 
    return noteDurations;
  }

  function getMoveDirection(currentBox, nextBox) {
    let moveDirection;
    let distance;
    
    if (nextBox.position.x == currentBox.position.x && nextBox.position.z < currentBox.position.z) {
      moveDirection = BoxSide.BACK;
      //distance = baseWidth;
    } else if (nextBox.position.x > currentBox.position.x) {
      moveDirection = BoxSide.RIGHT;
      //distance = currentBox.duration * baseWidth;
    } else if (nextBox.position.x < currentBox.position.x) {
      moveDirection = BoxSide.LEFT;
      //distance = currentBox.duration * baseWidth;
    } else if (nextBox.position.x == currentBox.position.x && nextBox.position.z > currentBox.position.z) {
      moveDirection = BoxSide.FRONT;
      //distance = baseWidth;
    } else {
      // Set default
      moveDirection = BoxSide.RIGHT;
      //distance = currentBox.duration * baseWidth;
    }
    return moveDirection;
    //return { moveDirection, distance };
  }
  
  // Function to handle mouse clicks
  p.mousePressed = function() {
    // -------------------------------------------- Determine if any box is currently chosen --------------------------------------------
    currentChoosedBox = noteBoxes.find(box => box.isChoosed);
    let clickedBox = noteBoxes.find(box => box.isMouseOver(p));
    // If a box is clicked, choose it
    if (clickedBox) {
        noteBoxes.forEach(box => {
            box.isChoosed = (box === clickedBox);
        });
    } else if (!currentNoteDuration && !currentNotePitch) {
        // If the mouse click is not on a dropdown or piano key, deselect all boxes
        noteBoxes.forEach(box => {
            box.isChoosed = false;
        });
    }

    // ------------- a new select in 3D
    currentNoteDuration = choosedNoteDuration();
    
    if (currentNoteDuration && currentChoosedBox) {
      currentChoosedBox.isChoosed = true;
      currentChoosedBox.duration = currentNoteDuration.duration;
    }



    // -------------------------------------------- define how to generate a new box --------------------------------------------
    // Check if any box is chosen
    let anyBoxChosen = noteBoxes.some(box => box.isChoosed);

    // Only handle potential box position if not interacting with dropdowns and no box is chosen
      if (!anyBoxChosen && !currentNotePitch && !currentNoteDuration) {
        if (!isOccupied(potentialBoxPosition)) {
            let newNoteBox = new NoteBox(potentialBoxPosition, default_duration, baseWidth);
            noteBoxes.push(newNoteBox);
            //detectAndDrawPotentialBoxes(newNoteBox, p);
            //potentialBoxPosition = null; // Reset potential box position
        }
    }
  }

  function choosedNoteDuration() {
    for (let duration of noteDurations) {
      if (duration.isMouseOver(p)) {
        return duration;
      }
    }
  }

  function playNote() {
    // reset the trackBall
    defaultTrackBall = new TrackBall(p.createVector(0, 0, 0));
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

  function deleteLatestBox() {
    if (noteBoxes.length > 1) {
      noteBoxes.pop();
    }
  }

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
    isMouseOverKeyboard = p.mouseX >= 0 && p.mouseX <= keys.length * whiteKeyWidth && p.mouseY >= 30 && p.mouseY <= 30 + whiteKeyHeight;
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
          // constructor(note, x, y, w, h, color)
          keys.push(new Key(note + octave, whiteX, 30, whiteKeyWidth, whiteKeyHeight, p.color(255, 255, 255)));
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
          keys.push(new Key(note + octave, blackX, 30, blackKeyWidth, blackKeyHeight, p.color(0, 0, 0)));
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
  let potentialBoxColor = p.color(0, 100, 255, 100); // Semi-transparent blue for the potential box
  
  p.push();
  p.fill(potentialBoxColor);
  p.stroke(210);
  p.translate(position.x + baseWidth / 2, -baseWidth / 2, position.z - baseWidth / 2);
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

function drawCoordinate(p) {
  p.push();
  p.stroke(255, 255, 255);
  p.line(-250, 0, 0, 250, 0, 0);
  p.stroke(255, 255, 255);
  p.line(0, -250, 0, 0, 250, 0);
  p.stroke(255, 255, 255);
  p.line(0, 0, -250, 0, 0, 250);
  p.pop();
}

function setCameraArguments(p) {
  // Pan: Cam rotation about y-axis (Left Right)
  azimuth = -p.atan2(cam1.eyeZ - cam1.centerZ, cam1.eyeX - cam1.centerX);
  // Tilt: Cam rotation about z-axis (Up Down)
  zenith = -p.atan2(cam1.eyeY - cam1.centerY, p.dist(cam1.eyeX, cam1.eyeZ, cam1.centerX, cam1.centerZ));
  f = p.height * 4.3 / 5;
  x = [-1, (p.mouseY - p.height / 2) / f, -(p.mouseX - p.width / 2) / f];
  R = math.multiply(Rz(-zenith), Ry(azimuth));
  x = math.multiply(x, R);
  xMag = p.dist(0, 0, 0, x._data[0], x._data[1], x._data[2]);

  // -------------------------------------------- Draw all boxes --------------------------------------------
  noteBoxes.forEach(box => {
    // Always detect the latest generated box
    detectAndDrawPotentialBoxes(noteBoxes[noteBoxes.length - 1], p);
    box.drawBox(p);
  });
}

