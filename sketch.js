let font;
let pianoSynth;
//let noteBoxSynth;
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
let maxOriginTracks = 5;
let trackDepth = 500;
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
let helpButton;
let visualizerButton;
let sequencerButton;
let tutorialButton;
let allTracksButton;

let newTrackBallButton;
let deleteBoxButton;

let defaultTrack = [];
let potentialBoxes = []; // Array to store potential boxes
let trackBalls = [];
let keys = [];
let noteDurations = [];
let note_duration = [1, 1/2, 1/4, 1/8, 1/16];
let tracks = []; // Array to store multiple noteBoxes arrays
let currentTrack = 0; // Index to keep track of the current track
let trackButtons = [];
let buttonY = 10;
let helps = [];

let isMouseOverKeyboard = false;
let showPotentialBox = false;
let helpVisible = true;
let isReverseOrder = false;
let secondTrack;
let secondTrackFirstClick = true;
let thirdTrack;
let thirdTrackFirstClick = true;
let fourthTrack;
let fourthTrackFirstClick = true;
let fifthTrack;
let fifthTrackFirstClick = true;

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
    //noteBoxSynth = new Tone.PolySynth().toMaster();
    // -------------------------------------------- set the initial box --------------------------------------------
    initialBox = new NoteBox(p.createVector(0, 0, 0), default_duration, defaultPitch); // Initialize the default box
    defaultTrack.push(initialBox);
    defaultTrack.isCloneTrack = false;
    defaultTrack.isReverseOrder = false;
    tracks.push(defaultTrack);

    // -------------------------------------------- Create button --------------------------------------------
    let playSpan = p.createSpan(`All tracks:`);
        playSpan.style('width', '480px');
        playSpan.style('height', '110px');
        playSpan.position(100, 660);

     allTracksButton = p.createButton('▶︎');
     allTracksButton.id('AllTracks');
     allTracksButton.mousePressed(() => playNote(p));
     allTracksButton.position(130, 735);

    let newTrackSpan = p.createSpan(`New tracks:`);
        newTrackSpan.style('width', '360px');
        newTrackSpan.style('height', '80px');
        newTrackSpan.position(200, 690);

     let originTrackButton = p.createButton('▶︎');
        originTrackButton.mousePressed(() => playTrack(defaultTrack));
        originTrackButton.position(230, 735);


    let secondTrackButton = p.createButton(`+`);
    secondTrackButton.mousePressed(() => {
      if (secondTrackFirstClick) {
        secondTrack = createNewTrack(p);
        secondTrackButton.html('►');
        secondTrackFirstClick = false;
        // Enable the third track button
        thirdTrackButton.removeAttribute('disabled');
      } else {
        playTrack(secondTrack);
      }
    });
    secondTrackButton.position(300, 735);

    let thirdTrackButton = p.createButton(`+`);
    thirdTrackButton.attribute('disabled', '');  // Disable the button initially
    thirdTrackButton.mousePressed(() => {
      if (thirdTrackFirstClick) {
        thirdTrack = createNewTrack(p);
        thirdTrackButton.html('►');
        thirdTrackFirstClick = false;
        // Enable the fourth track button
        fourthTrackButton.removeAttribute('disabled');
      } else {
        playTrack(thirdTrack);
      }
    });
    thirdTrackButton.position(370, 735);

    let fourthTrackButton = p.createButton(`+`);
    fourthTrackButton.attribute('disabled', '');  // Disable the button initially
    fourthTrackButton.mousePressed(() => {
      if (fourthTrackFirstClick) {
        fourthTrack = createNewTrack(p);
        fourthTrackButton.html('►');
        fourthTrackFirstClick = false;
         // Enable the fifth track button
         fifthTrackButton.removeAttribute('disabled');
      } else {
        playTrack(fourthTrack);
      }
    });
    fourthTrackButton.position(440, 735);

    let fifthTrackButton = p.createButton(`+`);
    fifthTrackButton.attribute('disabled', '');  // Disable the button initially
    fifthTrackButton.mousePressed(() => {
      if (fifthTrackFirstClick) {
        fifthTrack = createNewTrack(p);
        fifthTrackButton.html('►');
        fifthTrackFirstClick = false;
      } else {
        playTrack(fifthTrack);
      }
    });
    fifthTrackButton.position(510, 735);

    

    deleteBoxButton = p.createButton('- Delete note box');
    deleteBoxButton.mousePressed(deleteLatestBox);
    deleteBoxButton.position(1300, 50);
    deleteBoxButton.id('DeleteBox');

    let newTrackBallSpan = p.createSpan(`New trackBalls playing track:`);
        newTrackBallSpan.style('width', '300px');
        newTrackBallSpan.style('height', '80px');
        newTrackBallSpan.position(1100, 690);

    newTrackBallButton = p.createButton('+ add a new trackBall');
    newTrackBallButton.mousePressed(() => {
      if (numTracks - numOriginTracks < maxOriginTracks - 1) {
        newTrackBallButton.html('now hover mouse onto boxes');
        newTrackBallButton.attribute('disabled', '');  // Disable the button initially
          createNewTrackBall(p);
      } else {
        //alert("You can only add 4 new tracks");
        newTrackBallButton.attribute('disabled', '');
        newTrackBallButton.html('limit reached');
      }
    });
    newTrackBallButton.id('NewTrackBall')
    newTrackBallButton.position(900, 745);

    trackOrderToggle = p.createButton('same order');
    trackOrderToggle.mousePressed(() => {
      toggleTrackOrder();
    });
    trackOrderToggle.position(900, 690);
    trackOrderToggle.style('background', '#b3cbf2');
    trackOrderToggle.style('color', '#000307');
    trackOrderToggle.id('TrackOrder');

    // ------------------------------------------------------------------------------------------------

    visualizerButton = p.select('#Visualizer');
    visualizerButton.position(20, 50);

    sequencerButton = p.select('#Sequencer');
    sequencerButton.position(20, 110);
    sequencerButton.style('background', '#b3cbf2');
    sequencerButton.style('color', '#000307');

    tutorialButton = p.select('#Tutorial');
    tutorialButton.position(20, 170);

    helpButton = p.select('#Help');
    helpButton.style('background', '#b3cbf2');
    displayHelp(p);
    helpButton.mousePressed(() => toggleHelpButton(p));
    helpButton.position(20, 230);

    // Setup tooltips
    setupTooltips();
  }

  function setupTooltips() {
    const buttons = [visualizerButton, sequencerButton, tutorialButton, helpButton, allTracksButton, newTrackBallButton, trackOrderToggle, deleteBoxButton];
    const tooltip = p.createDiv('').addClass('tooltip');
    tooltip.hide();

    // Tooltip messages for each button
    const tooltips = {
        Visualizer: "Visualizer: <br>Visualize midi file by note boxes! <br>And interact with the boxes!",
        Sequencer: "Sequencer:  <br>Compose the music<br> by building note boxes!",
        Tutorial: "Tutorial: <br>Click to start the tutorial.",
        Help: "Help: <br> Click to see more guidance <br> Click again to close the messages",
        AllTracks: "This button will <br>synthesize all the tracks",
        NewTrackBall: "This button is for <br>adding new trackBall",
        TrackOrder: "Toggle the trackBall's order<br> same order / reverse order",
        DeleteBox: "Choose the last added box<br>click on the button to delete it"
    };

    buttons.forEach(button => {
        button.mouseOver(() => {
            const buttonId = button.elt.id;
            tooltip.html(tooltips[buttonId]);
            tooltip.style('visibility', 'visible');
            tooltip.style('opacity', '1');
            
            // Position the tooltip above the button
            const rect = button.elt.getBoundingClientRect();
            tooltip.position(rect.left + (rect.width) * 1.25 - (tooltip.elt.offsetWidth / 2), rect.top - tooltip.elt.offsetHeight);
            tooltip.show();
        });

        button.mouseOut(() => {
            tooltip.style('visibility', 'hidden');
            tooltip.style('opacity', '0');
            tooltip.hide();
        });
    });
  }

  function toggleHelpButton(p) {
    if (helpVisible) {
      helpButton.style('background', '#dcd8d8');
      hideHelp();
  } else {
      helpButton.style('background', '#b3cbf2');
      displayHelp(p);
  }
    helpVisible = !helpVisible;
  }

  function toggleTrackOrder() {
    if (!isReverseOrder) {
      trackOrderToggle.html('reverse order');
      trackOrderToggle.style('background', '#000307');
      trackOrderToggle.style('color', '#b3cbf2');
    } else {
      trackOrderToggle.html('same order');
      trackOrderToggle.style('background', '#b3cbf2');
      trackOrderToggle.style('color', '#000307');
    }
    isReverseOrder = !isReverseOrder;
  }

  function displayHelp(p) {
    let help_overall = p.createSpan(`
      <strong>Tips:</strong><br><br>
          First, click on the box to choose it.<br>
          (it will become transparent pink) <br><br>
          Adjust its <strong>pitch</strong> by selecting the corresponding key.<br>
          Adjust its <strong>duration</strong> by selecting the transparent boxes above it.<br>
          Or, generate a new box around it.<br><br>
          Finally, click on the <strong>play button</strong> to hear your track!<br><br>

          <strong>Click on the "?" button again to close the messages</strong>
    `);
    help_overall.style('width', '420px');
    help_overall.position(20, 300);

      helps.push(help_overall);

      let help_addNewTrackBall = p.createSpan(`
        <strong>How to Add a New TrackBall:</strong><br>
        <ol>
            <li>First, choose the <strong>order</strong>:</li>
            <ul>
                <li><strong>Same Order</strong>: The new trackball will follow <br>the same order as the original trackball.</li>
                <li><strong>Reverse Order</strong>: The new trackball will follow <br>the reverse order of the original trackball.</li>
            </ul>
            <br>
            <li>Click on the <strong>"Add a New TrackBall"</strong> button.</li>
            <li>Hover your mouse over the boxes. <br>You will see the potential trackball positions on the boxes.</li>
            <li>Click on the box where you want to add the trackball.</li>
        </ol>
    `);
      help_addNewTrackBall.style('width', '420px');
      help_addNewTrackBall.position(950, 300);
  
        helps.push(help_addNewTrackBall);
  }

  function hideHelp() {
    helps.forEach(help => help.remove());
    helps = [];
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
    let newTrackInitialBox = new NoteBox(p.createVector(0, trackDepth * (numOriginTracks - 1), 0), default_duration, defaultPitch);
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

    return newTrack;

    // Create a play button for the new track
    // let playButton = p.createButton(`▶︎`);
    // playButton.position(500 + (numOriginTracks - 1) * 70, 735); // Adjust the position dynamically
    // playButton.mousePressed(() => playTrack(newTrack)); // Pass the correct track index
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
    tracks.forEach(track => {
      let anyBoxIsAdding = track.some(box => box.isAddingNewTrackBall); // Check if any box in the track is active
      if (!anyBoxIsAdding) {
        p.orbitControl(2); // Set the default trackball if no boxes are active
      }
    });

    // -------------------------------------------- Draw the trackBall --------------------------------------------
    tracks.forEach(track => {
      let anyBoxActive = track.some(box => box.isActivate); // Check if any box in the track is active
      if (!anyBoxActive) {
        setDefaultTrackBall(p); // Set the default trackball if no boxes are active
      }
    });
    
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
        //let moveDirection;

        if (currentBox.isActivate) {
          let currentTime = p.millis();
          let elapsedTime = currentTime - (currentBox.startTime * 1000); // convert startTime to milliseconds
          //console.log(`currentTime: ${currentTime} elapsedTime: ${elapsedTime} note_duration_ms: ${note_duration_ms}`)
          if (elapsedTime < note_duration_ms) {
            if (j < currentTrack.length - 1) {
                nextBox = currentTrack[j + 1];
                //moveDirection = getMoveDirection(currentBox, nextBox);
                let t = elapsedTime / note_duration_ms; // Interpolation amount (0 to 1)
                currentTrackBall.updatePosition(p, currentBox, nextBox, t);
            } 
          }
          currentTrackBall.display(p); 
        }
        
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
      let boxHeight = defaultPitch + (currentTrackInitialBox.pitch - defaultPitch) * 4;
      
      trackBall.x = currentTrackInitialBox.position.x + currentTrackInitialBox.duration * baseWidth / 2;
      trackBall.y = currentTrackInitialBox.position.y - boxHeight - trackBallBase;
    }
  }

  function setNoteDurations(currentChoosedBox) {
    let noteDurations = [];
    for (let i = 0; i < note_duration.length; i++){
      noteDurations.push(new NoteDuration(note_duration[i], currentChoosedBox));
    } 
    return noteDurations;
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
        let boxHeight = defaultPitch + (anyBoxForPotentialTrackBall.pitch - defaultPitch) * 4;
        newTrackBall.y = anyBoxForPotentialTrackBall.position.y - boxHeight - trackBallBase;
        trackBalls.push(newTrackBall);
        // After adding a new trackball, reset all the box's isAddingNewTrackBall property
        tracks.forEach(track => {
          track.forEach(box => {
            box.isAddingNewTrackBall = false;
          });
        });

        // Call setNewTrackButton with the specific track's index
        setNewCloneTrack(index, trackIndex, p);
        newTrackBallButton.html('+ add new trackBall');
        newTrackBallButton.removeAttribute('disabled');
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
        if (potentialBoxPosition && !isOccupied(potentialBoxPosition)) {
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
              });
            }
        }
    }
  } 
}


function setNewCloneTrack(index, trackIndex, p) {
  let newCloneTrack = [];
  let oldTrack = tracks[trackIndex];

  if (isReverseOrder) {
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

  // Create a play button for the new track
  let playButton = p.createButton(`▶︎`);
  playButton.position(1060 + (numTracks - numOriginTracks) * 70, 735); // Adjust the position dynamically
  playButton.mousePressed(() => playTrack(newCloneTrack)); // Pass the correct track index
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
      trackBalls[i].y = initialBox.position.y - (defaultPitch + (initialBox.pitch - defaultPitch) * 4) - trackBallBase;
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

              activateVisualEffect(box, tracks[i].isReverseOrder);
              // Schedule the deactivation of the visual effect when the note ends
              setTimeout(() => {
                  deactivateVisualEffect(box, tracks[i].isReverseOrder);
              }, Tone.Time(value.duration).toMilliseconds());
          }, [{
              time: Tone.Time(box.ticks, 'i').toSeconds(),
              name: note_pitch,
              duration: note_duration
          }]).start(); // Start the part to begin scheduling events
      });
    }
    // Start the Tone.Transport to begin playback
    Tone.Transport.start();
}

function playTrack(track) {
  // Reset the default trackBall
  resetTrackBallPositions();
  // Set the pulses per quarter note (PPQ)
  Tone.Transport.PPQ = PPQ;
  // Function to set note values if needed
  setNoteValues();

  let synth;

  //synths[i] = new Tone.PolySynth().toMaster();
  synth = new Tone.Synth();
  synth.oscillator.type = "sine";
  synth.toDestination();
  // Iterate through each noteBox to schedule notes
    track.forEach(box => {
      const note_pitch = midiNoteToNoteName(box.pitch);
      const note_duration = convertDurationToToneJS(box.duration);

      // Create a Tone.Part for each noteBox
      var part = new Tone.Part(function(time, value) {
          // Schedule the synth to play the note with the specified parameters
          synth.triggerAttackRelease(value.name, value.duration, time);

          activateVisualEffect(box, track.isReverseOrder);
          // Schedule the deactivation of the visual effect when the note ends
          setTimeout(() => {
              deactivateVisualEffect(box, track.isReverseOrder);
          }, Tone.Time(value.duration).toMilliseconds());
      }, [{
          time: Tone.Time(box.ticks, 'i').toSeconds(),
          name: note_pitch,
          duration: note_duration
      }]).start(); // Start the part to begin scheduling events
  });
  
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

  function activateVisualEffect(box, state) {
    // Activate the visual effect when the note is played
    tracks.forEach(track => {
      track.forEach(noteBox => {
        if (noteBox.position.equals(box.position) && track.isReverseOrder === state) { // Use equals method to compare p5.Vector positions
          noteBox.isActivate = true;
          noteBox.startTime = Tone.now();
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

  function deactivateVisualEffect(box, state) {
    tracks.forEach(track => {
      track.forEach(noteBox => {
        if (noteBox.position.equals(box.position) && track.isReverseOrder === state) { // Use equals method to compare p5.Vector positions
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
  }

  p.draw = function() {
    p.textFont(font);
    p.background(210);
    
    isMouseOverKeyboard = p.mouseX >= keyboardStartX && p.mouseX <= keyboardStartX + keyboardLength && p.mouseY >= 30 && p.mouseY <= 30 + whiteKeyHeight;
    keyboardEffects(p);
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
        //key.color = p.color(200, 218, 247);
        setKeyColor(p, key);
      } 
    } else {
      key.darken(p);
    }

    if (key.isActivate) {
      //key.color = p.color(200, 218, 247);
      setKeyColor(p, key);
    } 
    key.display(p);
  }
}

function setKeyColor(p, key) {
  let noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  let colors = [
    'rgba(226, 165, 173, 0.5)', 'rgba(201, 147, 154, 0.5)', 'rgba(237, 205, 206, 0.5)', 
    'rgba(209, 182, 183, 0.5)', 'rgba(239, 241, 254, 0.5)', 'rgba(246, 246, 246, 0.5)', 
    'rgba(201, 192, 181, 0.5)', 'rgba(181, 199, 201, 0.5)', 'rgba(195, 217, 219, 0.5)', 
    'rgba(136, 149, 177, 0.5)', 'rgba(118, 129, 153, 0.5)', 'rgba(84, 108, 140, 0.5)'
  ];

  // Extract the note name from the key's note (e.g., C4 -> C)
  let noteName = key.note.slice(0, -1); // This removes the last character which represents the octave (e.g., 4)

  for (let i = 0; i < noteNames.length; i++) {
    if (noteName === noteNames[i]) {
      key.color = p.color(colors[i]);
      break;
    }
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
      potentialPosition = p.createVector(box.position.x - baseWidth, box.position.y, box.position.z);
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
      //let boxWidth = box.duration * baseWidth;
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

