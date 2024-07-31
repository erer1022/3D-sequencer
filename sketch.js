let font;
let pianoSynth;
let noteBoxSynth;
let initialBox;
let currentNotePitch;
let currentNoteDuration;
let currentChoosedBox;
let defaultTrackBall;
let trackOrderToggle;
let latestBox;
let currentTrackIndex = -1;

let numTracks = 1; // Initial number of tracks (default track)
let numOriginTracks = 1;
let trackDepth = 400;
let keyboardLength = 0;
let keyboardStartX = 200;
let default_duration = 1;
let trackBallBase = 20;
let zoomLevel = 1; // Variable to store the zoom level
let whiteKeyWidth = 30;
let blackKeyWidth = 18;
let whiteKeyHeight = 90;
let blackKeyHeight = 50;
let sketch3DHeight = 700;
let sketch2DHeight = 150;
let defaultPitch = 60; // set to middle C

let defaultBPM = 60; // 60 BPM means 1 beat per second
let PPQ = 48; // Pulses Per Quarter note (1 second per quarter note)
let baseWidth = 4 * PPQ; // Each whole note duration corresponds to 240 ticks

let potentialBoxPosition = null;

let noteBoxes = []; // Array to store newly created boxes with their note_duration
let defaultTrack = [];
let potentialBoxes = []; // Array to store potential boxes
let trackBalls = [];
let keys = [];
let noteDurations = [];
let note_duration = [1, 1/2, 1/4, 1/8, 1/16];
let tracks = []; // Array to store multiple noteBoxes arrays
let currentTrack = 0; // Index to keep track of the current track

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
    cam1.setPosition(500, -800, 1000); // Adjust the position (x, y, z) as needed
    cam1.lookAt(0, 0, 0); // Point the camera at the origin

    // set the tone.synth
    noteBoxSynth = new Tone.PolySynth().toMaster();

    // -------------------------------------------- Create button --------------------------------------------
    let playButton = p.createButton('▶︎');
    playButton.mousePressed(() => playNote(p));
    playButton.position(30, 50);

    let deleteButton = p.createButton('- Delete note box');
    deleteButton.mousePressed(deleteLatestBox);
    deleteButton.position(30, 250);

    let newTrackBallButton = p.createButton('+ add a new trackBall');
    newTrackBallButton.mousePressed(() => createNewTrackBall(p));
    newTrackBallButton.position(30, 350);

    let newTrackButton = p.createButton(`+ new track`);
    newTrackButton.mousePressed(() => createNewTrack(p));
    newTrackButton.position(30, 150);
    
    // -------------------------------------------- set the initial box --------------------------------------------
    initialBox = new NoteBox(p.createVector(0, 0, 0), default_duration, defaultPitch); // Initialize the default box
    defaultTrack.push(initialBox);
    defaultTrack.isCloneTrack = false;
    defaultTrack.isReverseOrder = false;
    tracks.push(defaultTrack);
  }

  

  function createNewTrackBall(p) {
    // Set all the boxes to the adding trackball mode, so that the user can choose which box to add the new trackball
    tracks.forEach(track => {
        if (!track.isCloneTrack) {
            track.forEach(box => {
                box.isAddingNewTrackBall = true;
            });
        }
    });
  }

  function createNewTrack(p) {
    // set the initial box of the new track
    let newTrackInitialBox = new NoteBox(p.createVector(0, trackDepth * numOriginTracks, 0), default_duration, defaultPitch);
    let newTrack = [newTrackInitialBox];
    newTrack.isCloneTrack = false;
    newTrack.isReverseOrder = false;
    tracks.push(newTrack);
    
    // set the default track ball of the new track
    let newTrack_defaultTrackBall = new TrackBall(p.createVector(0, trackDepth * numOriginTracks, 0));
    newTrack_defaultTrackBall.isReverseOrder = false;
    trackBalls.push(newTrack_defaultTrackBall);

    // Increment the number of tracks
    numTracks++;
    numOriginTracks++;
  }

  p.draw = function() {
    p.textFont(font);
    p.background(210);
    setCameraArguments(p);

    // -------------------------------------------- Draw all boxes --------------------------------------------
    tracks.forEach(track => {
      track.forEach(box => {
        box.display(p);
      });
    });

    tracks.forEach(track => {
        let lastBox = track[track.length - 1];
        if (!track.isCloneTrack && lastBox.isChoosed) {
          detectAndDrawPotentialBoxes(lastBox, p);
        }
    });

    // -------------------------------------------- set the orbit control --------------------------------------------
    // Only if no box is chosen, enable orbit control
    let boxChoosed = false;
    for (let i = 0; i < defaultTrack.length; i++) {
      if (defaultTrack[i].isChoosed) {
        boxChoosed = true;
      }
    }
    if (!boxChoosed) {
      p.orbitControl(3);
    }

    // -------------------------------------------- Draw the trackBall --------------------------------------------
    setDefaultTrackBall(p);
    updateTrackBalls(p);

    trackBalls.forEach(ball => {
      ball.display(p);
    });

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

  function updateTrackBalls(p) {
    for (let i = 0; i < tracks.length; i++) {
      let currentTrack = tracks[i];
      let currentTrackBall = trackBalls[i];

      for (let j = 0; j < currentTrack.length; j++) {
        let currentBox = currentTrack[j];
        let note_duration = convertDurationToToneJS(currentBox.duration);
        let note_duration_ms = Tone.Time(note_duration).toMilliseconds();
        let nextBox;
        let moveDirection;

        if (j < currentTrack.length - 1) {
          nextBox = currentTrack[j + 1];
          if (currentBox.isActivate ) {
            moveDirection = getMoveDirection(currentBox, nextBox);
            currentTrackBall.updatePosition(currentBox, nextBox, moveDirection, note_duration_ms / 1000);
          }
        }
        currentTrackBall.display(p);
      }
    }
  }


  function setDefaultTrackBall(p) {
    if (!defaultTrackBall) {
      // for each track, the default track ball is always begin at the orgin and move on in the forward order.
      defaultTrackBall = new TrackBall(p.createVector(0, 0, 0));
      //defaultTrackBall.h = defaultPitch;
      defaultTrackBall.isReverseOrder = false;
      trackBalls.push(defaultTrackBall);
    } else {
      // update its h, if the first noteBox's pitch get changed
      defaultTrackBall.y = 0 - tracks[0][0].pitch - trackBallBase;
    }

    for (let i = 0; i < tracks.length; i++) {
      let trackBall = trackBalls[i];
      let currentTrackInitialBox = tracks[i][0];
      trackBall.y = currentTrackInitialBox.position.y - currentTrackInitialBox.pitch - trackBallBase;
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
    
    if (nextBox.position.x == currentBox.position.x && nextBox.position.z < currentBox.position.z) {
      moveDirection = BoxSide.BACK;
    } else if (nextBox.position.x > currentBox.position.x) {
      moveDirection = BoxSide.RIGHT;
    } else if (nextBox.position.x < currentBox.position.x) {
      moveDirection = BoxSide.LEFT;
    } else if (nextBox.position.x == currentBox.position.x && nextBox.position.z > currentBox.position.z) {
      moveDirection = BoxSide.FRONT;
    } else {
      // Set default
      moveDirection = BoxSide.RIGHT;
    }
    return moveDirection;
  }
  
  // Function to handle mouse clicks
  p.mousePressed = function() {
    // -------------------------------------------- Determine if any box is currently chosen --------------------------------------------
    // Find the currently chosen box across all tracks
    //currentChoosedBox = null;
    for (let track of tracks) {
      currentChoosedBox = track.find(box => box.isChoosed);
      if (currentChoosedBox) break; // Exit loop once the chosen box is found
    }

    // Find the clicked box across all tracks
    let clickedBox = null;
    for (let track of tracks) {
      clickedBox = track.find(box => box.isMouseOver(p));
      if (clickedBox) break; // Exit loop once the clicked box is found
    }

    // If there are multiple tracks on the same position, if a box is clicked, choose all the box on the same position
    if (clickedBox) {
      let clickedPosition = clickedBox.position;
      tracks.forEach(track => {
        track.forEach(box => {
          if (box.position.equals(clickedPosition)) {
            box.isChoosed = true;
          } else {
            box.isChoosed = false;
          }
        });
      });
    } else if (!currentNoteDuration && !currentNotePitch) {
        // If the mouse click is not on a dropdown or piano key, deselect all boxes
        tracks.forEach (track => {
          track.forEach (box => {
            box.isChoosed = false;
          });
        });
    }

    // -------------------------------------------- update note duration --------------------
    currentNoteDuration = choosedNoteDuration(p);
    
    if (currentNoteDuration && currentChoosedBox) {
      currentChoosedBox.isChoosed = true;
      currentChoosedBox.duration = currentNoteDuration.duration;

      if (tracks.length > 1) {
        tracks.forEach (track => {
          track.forEach (box => {
            if (box.position.equals(currentChoosedBox.position)) {
              box.isChoosed = true;
              box.duration = currentNoteDuration.duration;
            }
          });
        });
      }
    } 

    // -------------------------------------------- define how to generate a new trackball --------------------------------------------
    let anyBoxForPotentialTrackBall = null;
    let trackIndex = -1; // To keep track of which track contains the box
    tracks.forEach((track, index) => {
      if (!anyBoxForPotentialTrackBall) {
        anyBoxForPotentialTrackBall = track.find(box => box.isAddingNewTrackBall && box.isMouseOver(p));
        if (anyBoxForPotentialTrackBall) {
          trackIndex = index;
        }
      }
    });

  if (anyBoxForPotentialTrackBall) {
    if (trackIndex !== -1) { // Ensure trackIndex is valid
      let index = tracks[trackIndex].indexOf(anyBoxForPotentialTrackBall);  
      if (index !== -1) { // Ensure the box is found in the track
        let newTrackBall = new TrackBall(anyBoxForPotentialTrackBall.position);
        trackBalls.push(newTrackBall);
        // After adding a new trackball, reset all the box's isAddingNewTrackBall property
        tracks.forEach(track => {
          track.forEach(box => {
            box.isAddingNewTrackBall = false;
          });
        });

        // Call setNewTrackButton with the specific track's index
        setNewCloneTrack(index, trackIndex, p);
      }
    }
  }

    // -------------------------------------------- define how to generate a new box --------------------------------------------
    // Check if any box is chosen
    let anyBoxChosen = null;
    for (let track of tracks) {
      anyBoxChosen = track.some(box => box.isChoosed);
      if (anyBoxChosen) break; // Exit loop once the chosen box is found
    }

    if (!anyBoxChosen) {
      tracks.forEach(track => {
        track.forEach(box => {
            box.isChoosed = false;
        });
      });
    }

    // Only handle potential box position if not interacting with dropdowns and no box is chosen
      if (!anyBoxChosen && !currentNotePitch && !currentNoteDuration && !anyBoxForPotentialTrackBall) {
        if (potentialBoxPosition) {
          let trackNum;
            for (let i = 0; i < numTracks; i++) {
              if (i * trackDepth == potentialBoxPosition.y) {
                trackNum = i;
              }
            }
            let currentTrack = tracks[trackNum];
            latestBox = new NoteBox(potentialBoxPosition, default_duration, defaultPitch);
            currentTrack.push(latestBox);

            // add new box to the clone tracks, if the clone track is forward order
            if (currentTrack.cloneTracks && currentTrack.cloneTracks.length > 0) {
              currentTrack.cloneTracks.forEach (cloneTrack => {
                if (!cloneTrack.isReverseOrder) {
                  cloneTrack.push(latestBox.clone(p));
                }
              })
            }
        }
    }
  } 
}


function setNewCloneTrack(index, trackIndex, p) {
  let newCloneTrack = [];
  let oldTrack = tracks[trackIndex];

  if (trackOrderToggle.isReverse) {
      // Clone the boxes from the specified track in reverse order
      for (let i = index; i >= 0; i--) {
          newCloneTrack.push(oldTrack[i].clone(p));
          newCloneTrack.isReverseOrder = true;
      }
  } else {
      // Clone the boxes from the specified track in forward order
      for (let i = index; i < oldTrack.length; i++) {
          newCloneTrack.push(oldTrack[i].clone(p));
          newCloneTrack.isReverseOrder = false;
      }
  }
  
  // Initialize cloneTrack array if it doesn't exist
  if (!oldTrack.cloneTracks) {
      oldTrack.cloneTracks = [];
  }
  
  // Add the new clone track to the cloneTrack array of the old track
  oldTrack.cloneTracks.push(newCloneTrack);

  // Set the isCloneTrack attribute on the new clone track
  newCloneTrack.isCloneTrack = true;
  
  // Add the new clone track to the tracks array
  tracks.push(newCloneTrack);
  numTracks++;
}


  function choosedNoteDuration(p) {
    for (let duration of noteDurations) {
      if (duration.isMouseOver(p)) {
        return duration;
      }
    }
  }

  function resetTrackBallPositions() {
    for (let i = 0; i < tracks.length; i++) {
      let initialBox = tracks[i][0]
      trackBalls[i].x = initialBox.position.x + initialBox.duration * baseWidth / 2;
      trackBalls[i].y = initialBox.position.y - initialBox.pitch - trackBallBase;
      trackBalls[i].z = initialBox.position.z - baseWidth / 2;
    }
  }

  function playNote(p) {
    // Reset the default trackBall
    resetTrackBallPositions();
    // Set the pulses per quarter note (PPQ)
    Tone.Transport.PPQ = PPQ;
    // Function to set note values if needed
    setNoteValues();

    const synths = [];

    for (let i = 0; i < tracks.length; i ++) {
      //synths[i] = new Tone.PolySynth().toMaster();
      synths[i] = new Tone.Synth();
      synths[i].oscillator.type = "sine";
      synths[i].toDestination();
      // Iterate through each noteBox to schedule notes
        tracks[i].forEach(box => {
          const note_pitch = midiNoteToNoteName(box.pitch);
          const note_duration = convertDurationToToneJS(box.duration);

          // Create a Tone.Part for each noteBox
          var part = new Tone.Part(function(time, value) {
              // Schedule the synth to play the note with the specified parameters
              synths[i].triggerAttackRelease(value.name, value.duration, time);

              activateVisualEffect(box);
              // Schedule the deactivation of the visual effect when the note ends
              setTimeout(() => {
                  deactivateVisualEffect(box);
              }, Tone.Time(value.duration).toMilliseconds());
          }, [{
              time: Tone.Time(box.ticks, 'i').toSeconds(),
              name: note_pitch,
              duration: note_duration
          }]).start(); // Start the part to begin scheduling events
      });
    }

    // // Iterate through each noteBox to schedule notes
    // defaultTrack.forEach(box => {
    //     const note_pitch = midiNoteToNoteName(box.pitch);
    //     const note_duration = convertDurationToToneJS(box.duration);

    //     // Create a Tone.Part for each noteBox
    //     var part = new Tone.Part(function(time, value) {
    //         // Schedule the synth to play the note with the specified parameters
    //         noteBoxSynth.triggerAttackRelease(value.name, value.duration, time);

    //         activateVisualEffect(box);
    //         // Schedule the deactivation of the visual effect when the note ends
    //         setTimeout(() => {
    //             deactivateVisualEffect(box);
    //         }, Tone.Time(value.duration).toMilliseconds());
    //     }, [{
    //         time: Tone.Time(box.ticks, 'i').toSeconds(),
    //         name: note_pitch,
    //         duration: note_duration
    //     }]).start(); // Start the part to begin scheduling events
    // });

    // Start the Tone.Transport to begin playback
    Tone.Transport.start();
}
  
  // Helper function to convert Tone.js duration to milliseconds
  Tone.Time.prototype.toMilliseconds = function() {
    return this.toSeconds() * 1000;
  }

  function setNoteValues() {
    for(let i = 0; i < tracks.length; i++) {
      //let delay = i * 480;
      //let cumulativeTicks = delay;
      let cumulativeTicks = 0;
      tracks[i].forEach (noteBox => {
          noteBox.ticks = cumulativeTicks + "i";
          // the default baseWidth is set to a whole note => 4 * PPQ, 
          // if box.duration = 1, baseWidth = 4 * 60 = 240, so the noteDurationInTicks will be 240
          let noteDurationInTicks = noteBox.duration * baseWidth;
          cumulativeTicks += noteDurationInTicks;
      });
    }
  }

  function activateVisualEffect(box) {
    // Activate the visual effect when the note is played
    tracks.forEach(track => {
      track.forEach(noteBox => {
        if (noteBox.position.equals(box.position)) { // Use equals method to compare p5.Vector positions
          noteBox.isActivate = true;
        }
      });
    });
    //box.isActivate = true;
    for (let key of keys) {
        if (midiNameToNumber(key.note) == box.pitch) {
            key.isActivate = true;
        }
    }
  }

  function deactivateVisualEffect(box) {
    tracks.forEach(track => {
      track.forEach(noteBox => {
        if (noteBox.position.equals(box.position)) { // Use equals method to compare p5.Vector positions
          noteBox.isActivate = false;
        }
      });
    });
    //box.isActivate = false;
    for (let key of keys) {
        if (midiNameToNumber(key.note) == box.pitch) {
            key.isActivate = false;
        }
    }
  }


  function deleteLatestBox() {
    
    if (!latestBox) return;

    // Find the track index with the latest box
    try {
        tracks.forEach((track, index) => {
            let lastBoxOfTrack = track[track.length - 1];
            // choose the origin track, not the clone track
            
            if (!track.isCloneTrack && lastBoxOfTrack.position.equals(latestBox.position)) {
                currentTrackIndex = index;
                // Return from forEach by throwing an exception
                throw new Error("Found");
            }
        });
    } catch (e) {
        if (e.message !== "Found") throw e;
    }

    if (currentTrackIndex !== -1) {
        let currentTrack = tracks[currentTrackIndex];

        // Handle clone tracks if they exist
        if (currentTrack.cloneTracks && currentTrack.cloneTracks.length > 0) {
            currentTrack.cloneTracks = currentTrack.cloneTracks.filter(clone => {
                let cloneTrackIndex = tracks.indexOf(clone);
                if (clone.isReverseOrder) {
                    // If the first box of the reverse order track has the same position as latestBox.position
                    if (clone.length > 1 && clone[0].position.equals(latestBox.position)) {
                        clone.shift(); // Remove the first box
                    }
                } else {
                  if (clone.length > 1) {
                    clone.pop(); // Remove the last box
                  }
                }
                // If the clone track has the only initial box, remove the whole clone track.
                if (tracks[cloneTrackIndex].length === 1 && cloneTrackIndex !== -1) {
                  tracks.splice(cloneTrackIndex, 1);
                  trackBalls.splice(cloneTrackIndex, 1);
                  numTracks--;
                  return false; // Remove from cloneTracks array
              }
                // If the clone track is empty, remove it from the cloneTracks array
                return true;
            });
        }

        // Remove the last box from the main track, keep the initial box
        if (currentTrack.length > 1) {
          currentTrack.pop();
        }

        // Update latestBox to the new last box of the current track if it still exists
        if (currentTrack.length > 1) {
          latestBox = currentTrack[currentTrack.length - 1];
      } else {
          latestBox = null;
      }
        
        console.log(`Deleted the latest box from track index ${currentTrackIndex}.`);
    } else {
        console.log("No matching track found with the latest box.");
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

    trackOrderToggle = new TrackOrderToggle(p.windowWidth - trackBallBase * 8, sketch2DHeight / 2);
  }

  p.draw = function() {
    p.textFont(font);
    p.background(210);
    
    isMouseOverKeyboard = p.mouseX >= keyboardStartX && p.mouseX <= keyboardStartX + keyboardLength && p.mouseY >= 30 && p.mouseY <= 30 + whiteKeyHeight;
    keyboardEffects(p);

    trackOrderToggle.display(p);
  }

  

  p.mousePressed = function() {
      currentNotePitch = clickPianoKeyboard();
      if (currentNotePitch && currentChoosedBox) {
        resetNoteBoxPitch();
      }

      // set track order
      if (trackOrderToggle.isMouseOver(p)) {
        if (trackOrderToggle.isReverse) {
          trackOrderToggle.isReverse = false;
        } else {
          trackOrderToggle.isReverse = true;
        }
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

function setPianoKeyboard(p) {
  let whiteX = keyboardStartX;
  let notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let numOctaves = 5; 
  let startOctave = 2; 

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

  // calculate the keyboard length
  keys.forEach(key => {
    if (!key.note.includes(`#`)) {
      keyboardLength += whiteKeyWidth;
    }
  });
}

function keyboardEffects(p) {
  for (let key of keys) {
    if (isMouseOverKeyboard) {
      key.lighten(p);
      if (key.isMouseOver(p)) {
        key.color = p.color(200, 218, 247);
      } 
    } else {
      key.darken(p);
    }

    if (key.isActivate) {
      key.color = p.color(200, 218, 247);
    } 
    key.display(p);
  }
}

function resetNoteBoxPitch() {
  currentChoosedBox.isChoosed = true;
  currentChoosedBox.pitch = midiNameToNumber(currentNotePitch);

  if (tracks.length > 1) {
    tracks.forEach (track => {
      track.forEach (box => {
        if (box.position.equals(currentChoosedBox.position)) {
          box.isChoosed = true;
          box.pitch = midiNameToNumber(currentNotePitch);
        }
      });
    });
  }
}


function detectAndDrawPotentialBoxes(box, p) {
  if (box.isMouseNearBoxBackSide(p)) {
    potentialBoxPosition = generatePotentialBoxesPositions(box, BoxSide.BACK, p);
    showPotentialBox = true;
  }

  if (box.isMouseNearBoxFrontSide(p)) {
    potentialBoxPosition = generatePotentialBoxesPositions(box, BoxSide.FRONT, p);
    showPotentialBox = true;
    //drawPotentialBox(potentialBoxPosition, p);
  }

  if (box.isMouseNearBoxLeftSide(p)) {
    potentialBoxPosition = generatePotentialBoxesPositions(box, BoxSide.LEFT, p);
    showPotentialBox = true;
    //drawPotentialBox(potentialBoxPosition, p);
  }

  if (box.isMouseNearBoxRightSide(p)) {
    potentialBoxPosition = generatePotentialBoxesPositions(box, BoxSide.RIGHT, p);
    showPotentialBox = true;
    //drawPotentialBox(potentialBoxPosition, p);
  }

  if (!showPotentialBox) {
    potentialBoxPosition = null;
  }

  if (potentialBoxPosition) {
    drawPotentialBox(potentialBoxPosition, p);
  }
  
  showPotentialBox = false;
}

// Function to generate potential boxes around a given position
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
  let potentialBoxColor = p.color(120, 120, 120, 100); // Semi-transparent blue for the potential box
  
  p.push();
  p.fill(potentialBoxColor);
  p.stroke(210);
  p.translate(position.x + baseWidth / 2, position.y - defaultPitch / 2, position.z - baseWidth / 2);
  p.box(baseWidth, defaultPitch, baseWidth); // Default potential box size
  p.pop();
}

// Function to check if a position is already occupied
function isOccupied(potentialBoxPosition) {
  for (let track of tracks) {
    for (let box of track) {
      let boxPos = box.position;
      let boxWidth = box.duration * baseWidth;

      console.log(`boxPos.x: ${boxPos.x} Width: ${boxPos.x + boxWidth} potential: ${potentialBoxPosition.x}`)
      console.log(`boxPos.z ${boxPos.y} pz: ${potentialBoxPosition.y}`)
      if (
        potentialBoxPosition.x === boxPos.x &&
        potentialBoxPosition.y === boxPos.y &&
        potentialBoxPosition.z === boxPos.z
      ) {
        return true;
      }
    }
  }
  return false;
  
  // for (let i = 0; i < tracks.length; i++) {
  //   let boxPos = defaultTrack[i].position.x;
  //   let boxWidth = defaultTrack[i].duration * baseWidth;
  //   if (position >= boxPos && position < boxPos + boxWidth) {
  //     return true;
  //   }
  // }
  // return false;
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
}

