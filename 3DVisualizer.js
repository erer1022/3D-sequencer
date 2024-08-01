let font;
let zoomLevel = 1;
let sketch3DHeight = 1000;
let sketch2DHeight = 150;
let trackDepth = -200;
let baseWidth = 100;
let boxDepth = 100;
let camX = 0;
let camY = 0;
let targetX;
let targetY;
let camSpeed = 0;
let globalBpm = 0;

let CW;
let useableMidiObject;
let previousMidiObject = null;
let fileDrop;
let playToggle;
let ticksSpan;
let positionSpan;
let bpmSpan;
let isPlaying = false;
let useableMidiObjectParsed = false;

let upButton;
let downButton;
let resetButton;
let rewindButton;
let builtInButton;
let currentTime;
let currentTimeInSeconds;

let trackNoteBoxes = [];
let tracks = [];  // for midi data
let builtInMidis = [];


// camera arguments
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
      // basic setting
      p.createCanvas(p.windowWidth, sketch3DHeight, p.WEBGL).parent('3d-container'); // Create a 3D canvas
      
      cam1 = p.createCamera();
      p.perspective(p.PI / 3, p.width / p.height, ((p.height / 2) / p.tan(p.PI / 6)) / 10, ((p.height / 2) / p.tan(p.PI / 6)) * 100);
      // Set the initial camera position and look at a specific point
    //   cam1.setPosition(camX, -300, 800); // Adjust the position (x, y, z) as needed
    //   cam1.lookAt(500, 0, 0); // Point the camera at the origin
        
      // Add passive wheel event listener
      //window.addEventListener('wheel', onWheel, { passive: true });
    }

    // function onWheel(event) {
    //     // Zoom in and out
    //     zoomLevel += event.deltaY * -0.001; // Adjust the zoom level based on the scroll amount
    //     zoomLevel = p.constrain(zoomLevel, 0.5, 2); // Constrain the zoom level to prevent it from getting too close or too far
    //     console.log('Zoom Level:', zoomLevel); // Optional: For debugging purposes
    // }

    p.draw = function() {
        p.textFont(font);
        p.background(210);

        if (Tone.Transport.state !== 'started') {
            p.orbitControl(3);
        }
        
        setCameraArguments(p);

        // Make sure the set procedure only conduct once, otherwise the computations is so heavy, it will influence the performance
        if (useableMidiObject && !useableMidiObjectParsed) {
            setMidiNoteBoxes(p);
            useableMidiObjectParsed = true; // Set the flag to true after parsing
        }

        if (useableMidiObject) {
            trackNoteBoxes.forEach(box => { 
                //if (box.position.x < p.windowWidth) {
                    activateNoteBoxes();
                    if (box.isActivate) {
                        targetX = box.position.x;
                    }
                    box.display(p);
                    camY = p.min(camY, box.position.y);
                //}
            });
        } 


        //console.log(`noe: ${Tone.now()}`)

        updateCurrentTimeInTicks();
        
        // Automatically move the camera horizontally
        //if (isPlaying && currentTime && useableMidiObject) {
           
            let distanceX = targetX - camX;
            let velocityX = distanceX / 60;

            if (velocityX) {
                camX += velocityX;
            } 

            cam1.setPosition(camX, camY - 200, 1000);
            cam1.lookAt(camX, 0, 0); // Point the camera at the moving x position
       //}
    }

        // Function to update the current time in ticks
    function updateCurrentTimeInTicks() {
        currentTime = Tone.Transport.ticks;
        // Schedule the next tick update
        Tone.Transport.scheduleOnce(updateCurrentTimeInTicks, "+0.0.1");
    }

    // Schedule the first tick update
    Tone.Transport.scheduleOnce(updateCurrentTimeInTicks, "+0.0.1");

    

    

    function setMidiNoteBoxes(p) {
        // if this function is called, reset the trackNoteBoxes
        trackNoteBoxes = [];
        // iterate over each track
        for (let i = 0; i < useableMidiObject.tracks.length; i++) {
            let track = useableMidiObject.tracks[i];
            let trackOffset = i * trackDepth;
            let notesByStartTime = {};

            // sort each track note by their start time
            track.notes.forEach(note => {
                if (!notesByStartTime[note.ticks]) {
                  notesByStartTime[note.ticks] = [];
                }
                notesByStartTime[note.ticks].push(note);
              });

              let boxPosX = 0;
              let sortedStartTimes = Object.keys(notesByStartTime).sort((a, b) => parseFloat(a) - parseFloat(b));

              for (let j = 0; j < sortedStartTimes.length; j++) {
                //for (let j = 0; j < 20; j++) {
                let startTime = sortedStartTimes[j];
                let notes = notesByStartTime[startTime];
                boxPosX = (startTime / useableMidiObject.header.ppq) * baseWidth;
                // ppq stands for 1/4
                
                let z = 0;
                
          
                notes.forEach(note => {
                  let noteDuration = note.durationTicks / useableMidiObject.header.ppq / 4;
                  let noteBox = new NoteBox(p.createVector(boxPosX, trackOffset, z), noteDuration, note.midi);
                  noteBox.startTime = note.ticks;
                  noteBox.endTime = note.ticks + note.durationTicks;
                  trackNoteBoxes.push(noteBox);
                  z += boxDepth;
                  
                });
              }
          }
    }
    

    function activateNoteBoxes() {
        trackNoteBoxes.forEach(box => {
            if (currentTime && box.startTime <= currentTime && 
                currentTime < box.endTime) {
                    box.isActivate = true;
                } else {
                    box.isActivate = false;
                }
        });
    }

}

let sketch2D = function(p) {
    p.preload = function() {
      font = p.loadFont('./Roboto/Roboto-Black.ttf');
    }
  
    p.setup = function() {
      p.createCanvas(p.windowWidth, sketch2DHeight).parent('2d-container');

      let visualizerButton = p.select('#Visualizer');
      visualizerButton.position(20, 50);
  
      let sequencerButton = p.select('#Sequencer');
      sequencerButton.position(20, 110);
  
      let tutorialButton = p.select('#Tutorial');
      tutorialButton.position(20, 170);

      CW = CW || {};
      CW.tempoOffset = 0;

        fileDrop = p.createFileInput(handleMidiFile);
        fileDrop.position(200, 60);
        // Use the changed method to handle new file upload
        fileDrop.changed(() => {
            let file = fileDrop.elt.files[0];
            if (file) {
                handleMidiFile(file);
            }
        });


        playToggle = p.createButton('▶︎');
        playToggle.position(200, 730);
        playToggle.attribute('disabled', ''); // Initially disabled
        // Simulate enabling the button after some condition is met (e.g., after 1 second)
        setTimeout(() => {
            playToggle.removeAttribute('disabled');
        }, 1000);

        // Add an event listener to the button for the 'click' event
        playToggle.mousePressed(() => {
            if (playToggle.attribute('disabled') === null) {
                // Toggle the state variable
                isPlaying = !isPlaying;

                // Simulate a "change" event
                handleButtonChange(isPlaying);
            }
        });

        ticksSpan = p.createSpan(`Ticks: 0`);
        ticksSpan.style(`color`, `#666e74`);
        ticksSpan.position(600, 60);

        // Create a span for position
        positionSpan = p.createSpan('Position 0:0');
        positionSpan.style(`color`, `#666e74`);
        positionSpan.position(450, 60);

        // Create a span for BPM
        bpmSpan = p.createSpan('BPM: 0');
        bpmSpan.style(`color`, `#666e74`);
        bpmSpan.position(720, 60);

        upButton = p.createButton(`UP`);
        upButton.mousePressed(() => changeTempo(`UP`));
        upButton.position(700, 730);

        downButton = p.createButton(`DOWN`);
        downButton.mousePressed(() => changeTempo(`DOWN`));
        downButton.position(800, 730);

        resetButton = p.createButton(`RESET`);
        resetButton.mousePressed(() => changeTempo(`RESET`));
        resetButton.position(900, 730);

        resetButton = p.createButton(`REWIND`);
        resetButton.mousePressed(rewindMusic);
        resetButton.position(100, 730);

        builtInButton = p.createButton(`🎼 🎵 🎶`);
        builtInButton.mousePressed(() => displayBuiltInOptions(p));
        builtInButton.position(p.windowWidth - 100, 60);
    }

    function displayBuiltInOptions(p) {
        let midiFiles = [
            "001 - Albeniz I - Tango",
            "002 - Bach, JS - Aria (Goldberg Variations)",
            "003 - Bach, JS - Fugue (WTC Bk-1 No-21)",
            "004 - Bach, JS - Fugue (WTC Bk-1 No-3)",
            "005 - Bach, JS - Fugue (WTC Bk-1 No-5)",
            "006 - Bach, JS - Fugue (WTC Bk-1 No-7)",
            "007 - Bach, JS - Gavotte (French Suite No-5)",
            "008-Debussy-Clair-de-lune"
        ];
        let positionY = 120;

        midiFiles.forEach((file) => {
            let item = p.createElement('div', file);
            item.mouseOver(() => item.style('background-color', '#555'));
            item.mouseOut(() => item.style('background-color', 'rgba(51, 51, 51, 0.05)'));
            item.mousePressed(() => loadBuiltInMidi(file));
            item.position(p.windowWidth - 350, positionY);
            item.class('builtIns');
            positionY += 35;
            builtInMidis.push(item);
        });
    }

    // function loadBuiltInMidi(file) {
    //     let builtIn = p.loadJSON(`/builtInMidi/${file}.json`);
    //     if (hasMidiObjectChanged(builtIn)) {
    //         previousMidiObject = builtIn;
    //         useableMidiObject = builtIn;
    //         useableMidiObjectParsed = false; // Reset the flag to indicate that parsing is needed
    //         resetToneSetup(useableMidiObject); // Reset Tone.js setup with the new MIDI object
    //    }
    //   makeSong(useableMidiObject);
    // }

    

    function rewindMusic() {
        Tone.Transport.stop();
        Tone.Transport.position = '0:0:0';
        camX = 0;
        if (Tone.Transport.state === 'started') {
            Tone.Transport.start();
        }
    }

    function changeTempo(dir) {
        switch (dir) {
          case 'UP':
            Tone.Transport.bpm.value += 1.01;
            CW.tempoOffset += 1.01;
            break;
      
          case 'DOWN':
            Tone.Transport.bpm.value -= 1.01;
            CW.tempoOffset -= 1.01;
            break;
      
          case 'RESET':
            if (Tone.Transport.state === 'started') {
              const baseTempo = Tone.Transport.bpm.value - CW.tempoOffset;
              Tone.Transport.bpm.value = baseTempo;
            }
            CW.tempoOffset = 0;
            break;
        }
      }

    // Function to handle the simulated "change" event
    function handleButtonChange(state) {
        if (state) {
            Tone.Transport.start();
            playToggle.html('❚❚'); // Change button label to 'Pause'
        } else {
            Tone.Transport.pause();
            playToggle.html('▶︎'); // Change button label to 'Play'
        }
    }

    function hasMidiObjectChanged(newMidiObject) {
        // Simple check if the objects are different
        return JSON.stringify(newMidiObject) !== JSON.stringify(previousMidiObject);
    }

    function handleMidiFile(file) {
        if (file.type === 'audio' && file.subtype === 'midi') {
          readFile(file.file);
        } else {
          alert("Please upload a MIDI file.");
        }
      }

      function readFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          let midi = new Midi(e.target.result);
          let newMidiObject = parseMidi(midi);
          if (hasMidiObjectChanged(newMidiObject)) {
                previousMidiObject = newMidiObject;
                useableMidiObject = newMidiObject;
                useableMidiObjectParsed = false; // Reset the flag to indicate that parsing is needed
                resetToneSetup(useableMidiObject); // Reset Tone.js setup with the new MIDI object
           }
          makeSong(useableMidiObject);
        };
        reader.readAsArrayBuffer(file);
      }

      function resetToneSetup(midi) {
        // Stop the transport and clear all events
        Tone.Transport.stop();
        Tone.Transport.cancel(0);
    
        // Remove all parts and synths (this assumes you have a reference to them)
        Tone.Transport.bpm.value = midi.header.tempos[0].bpm + CW.tempoOffset; // Reset the tempo to the first tempo event in the new MIDI file
        Tone.Transport.position = '0:0:0'; // Reset the position
      }
      
      function parseMidi(midi) {
        if (midi.header) {
          const midiJSON = JSON.stringify(midi, undefined, null);
          const parsedMidiObject = JSON.parse(midiJSON);
          //console.log(`parsedMidiObject: ${midiJSON}`)
          return parsedMidiObject;
        } else {
          alert("Something went wrong when parsing your midi file");
          location.reload();
        }
      }

      function makeSong(midi) {
        // Sets the PPQ (Pulses Per Quarter note) for the Tone.js transport
        Tone.Transport.PPQ = midi.header.ppq;
        const numofVoices = midi.tracks.length;
        const synths = [];
      
        //************** Tell Transport about Time Signature changes  ********************
        for (let i = 0; i < midi.header.timeSignatures.length; i++) {
          Tone.Transport.schedule(function(time) {
            Tone.Transport.timeSignature = midi.header.timeSignatures[i].timeSignature;
            //console.log(midi.header.timeSignatures[i].timeSignature, Tone.Transport.timeSignature, Tone.Transport.position);
          }, midi.header.timeSignatures[i].ticks + "i");
        }
      
         //************** Tell Transport about bpm changes  ********************
        for (let i = 0; i < midi.header.tempos.length; i++) {
          Tone.Transport.schedule(function(time) {
            Tone.Transport.bpm.value = midi.header.tempos[i].bpm + CW.tempoOffset;
            globalBpm = midi.header.tempos[i].bpm + CW.tempoOffset;
          }, midi.header.tempos[i].ticks + "i");
        }
      
        //************ Change time from seconds to ticks in each part  *************
        for (let i = 0; i < numofVoices; i++) {
          midi.tracks[i].notes.forEach(note => {
            note.time = note.ticks + "i";
          });
        }
      
        //************** Create Synths and Parts, one for each track  ********************
        for (let i = 0; i < numofVoices; i++) {
          synths[i] = new Tone.Synth().toDestination();
          var part = new Tone.Part(function(time, value) {
            synths[i].triggerAttackRelease(value.name, value.duration, time, value.velocity);
          }, midi.tracks[i].notes).start();
        }
      
        setupPlayer(midi);
      }

      function setupPlayer(midi) {
        //let resultsText = p.select('#resultsText');
        
        // Set the value of the resultsText textarea
        //resultsText.value(JSON.stringify(midi, undefined, 2));
      
        // Enable the playToggle button
        playToggle.removeAttribute('disabled');
      
        // Optionally, you can add an event listener using p5.js if needed
        // playToggle.mousePressed(togglePlay);
      }

      Tone.Transport.scheduleRepeat(function(time) {
        showPosition();
        ticksSpan.html("Ticks: " + Tone.Transport.ticks);
        bpmSpan.html("BPM: " + Tone.Transport.bpm.value.toFixed());
      }, "8n");
      
      function showPosition() {
        var myPos = Tone.Transport.position;
        var posArray = myPos.split(/\D+/);
        var myBar = Number(posArray[0]) + 1;
        var myBeat = Number(posArray[1]) + 1;
        positionSpan.html(myBar + ":" + myBeat);
      }
  
    p.draw = function() {
      p.textFont(font);
      p.background(210);
    }
}

// Create the p5 instances
new p5(sketch3D);
new p5(sketch2D);



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

