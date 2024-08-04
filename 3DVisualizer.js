let font;
let zoomLevel = 1;
let frameRate = 60;
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
let builtInOptionsVisible = false;

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
        p.orbitControl(3);
        p.frameRate(frameRate);
        if (globalBpm && globalBpm > 96) {
            frameRate = globalBpm;
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
                    if (globalBpm > 90) {
                        camY = -2500;
                    } else {
                        camY = p.min(camY, box.position.y);
                    }
                    
                //}
            });
        } 

        updateCurrentTimeInTicks();
        // Automatically move the camera horizontally
            let distanceX = targetX - camX;
            let velocityX = distanceX / (frameRate - 40);

            if (velocityX > 0) {
                camX += velocityX;
            } 
            cam1.setPosition(camX, camY - 300, 1200);
            cam1.lookAt(camX, 0, 0); // Point the camera at the moving x position
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
                  // set noteBox's startTime and endTime
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

        // -------------------------------------------- Tone.Transportation data --------------------------------------------
        ticksSpan = p.createSpan(`Ticks: 0`);
        ticksSpan.position(600, 60);

        // Create a span for position
        positionSpan = p.createSpan('Position 0:0');
        positionSpan.position(450, 60);

        // Create a span for BPM
        bpmSpan = p.createSpan('BPM: 0');
        bpmSpan.position(750, 60);

        // -------------------------------------------- tempo setting block
        let tempoSpan = p.createSpan(`TEMPO SETTING:`);
        tempoSpan.style('width', '270px');
        tempoSpan.style('height', '90px');
        tempoSpan.position(700, 690);

        upButton = p.createButton(`UP`);
        upButton.mousePressed(() => changeTempo(`UP`));
        upButton.position(720, 730);

        downButton = p.createButton(`DOWN`);
        downButton.mousePressed(() => changeTempo(`DOWN`));
        downButton.position(800, 730);

        resetButton = p.createButton(`RESET`);
        resetButton.mousePressed(() => changeTempo(`RESET`));
        resetButton.position(900, 730);

        // -------------------------------------------- playing setting block --------------------------------------------
        let playSpan = p.createSpan(`PLAY SETTING:`);
        playSpan.style('width', '160px');
        playSpan.style('height', '90px');
        playSpan.position(80, 690);


        playToggle = p.createButton('▶︎');
        playToggle.position(200, 730);
        playToggle.attribute('data-disabled', 'true');

        // Adding mousePressed event listener to the button
        playToggle.mousePressed(() => {
            if (playToggle.elt.getAttribute('data-disabled') === 'true') {
                isPlaying = false;
            alert("Please upload a MIDI file or choose built-in files to play music");
            } else {
                isPlaying = !isPlaying;
                handleButtonChange(isPlaying);
            }
        });

        resetButton = p.createButton(`REWIND`);
        resetButton.mousePressed(rewindMusic);
        resetButton.position(100, 730);

        // -------------------------------------------- Built-ins Setting -------------------------------------------- 
        builtInButton = p.createButton(`🎼 🎵 🎶`);
        builtInButton.mouseOver(() => {
            builtInButton.style('background', '#b3cbf2')
        })
        builtInButton.mousePressed(() => toggleBuiltInOptions(p));
        builtInButton.position(p.windowWidth - 100, 60);
    }

    

    function toggleBuiltInOptions(p) {
        if (builtInOptionsVisible) {
            builtInButton.style('background', '#dcd8d8');
            hideBuiltInOptions();
        } else {
            builtInButton.style('background', '#b3cbf2');
            displayBuiltInOptions(p);
        }
        builtInOptionsVisible = !builtInOptionsVisible;
    }

    function hideBuiltInOptions() {
        builtInMidis.forEach(item => item.remove());
        builtInMidis = [];
    }

    function displayBuiltInOptions(p) {
        let midiFiles = [
            "001",
            "002",
            "003",
            "004-Mr-Lawrence-Merry-Christmas",
            "005-Chopin-Nocturne-in-E-Flat-Opus-9-Nr-2",
            "006-Debussy-Reverie",
            "007-Canon-3",
            "008-Debussy-Clair-de-lune",
            "009",
            "010",
            "011",
            "012",
            "013",
            "014",
            "015",
            "016"
        ];
        let positionY = 120;

        midiFiles.forEach((file) => {
            let item = p.createElement('div', file);
            item.mouseOver(() => item.style('background-color', '#555'));
            item.mouseOut(() => item.style('background-color', 'rgba(51, 51, 51, 0.05)'));
            item.mousePressed(() => loadBuiltInMidi(p, file));
            item.position(p.windowWidth - 350, positionY);
            item.class('builtIns');
            positionY += 35;
            builtInMidis.push(item);
        });
    }

    function loadBuiltInMidi(p, file) {
        let fileUrl = `/builtInMidi/${file}.json`; // Construct the file URL based on the file name
        
        p.loadJSON(fileUrl, (json) => {
            handleMidiJSON(json); // Use the existing function to handle the parsed MIDI JSON object
        }, (error) => {
            console.error("Error loading MIDI JSON file:", error);
        });
    }
    
    function handleMidiJSON(json) {
        let newMidiObject = json;
        if (hasMidiObjectChanged(newMidiObject)) {
            previousMidiObject = newMidiObject;
            useableMidiObject = newMidiObject;
            useableMidiObjectParsed = false; // Reset the flag to indicate that parsing is needed
            isPlaying = false;
            handleButtonChange(isPlaying);
            resetToneSetup(useableMidiObject); // Reset Tone.js setup with the new MIDI object
        }
        makeSong(useableMidiObject);
    }
    
    function handleMidiFile(file) {
        // Check the MIME type of the file directly
        if (file.type === 'audio/midi' || file.type === 'audio') {
            readFile(file);
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
          synths[i] = new Tone.Sampler({
            urls: {
                A0: "A0.mp3",
                C1: "C1.mp3",
                "D#1": "Ds1.mp3",
                "F#1": "Fs1.mp3",
                A1: "A1.mp3",
                C2: "C2.mp3",
                "D#2": "Ds2.mp3",
                "F#2": "Fs2.mp3",
                A2: "A2.mp3",
                C3: "C3.mp3",
                "D#3": "Ds3.mp3",
                "F#3": "Fs3.mp3",
                A3: "A3.mp3",
                C4: "C4.mp3",
                "D#4": "Ds4.mp3",
                "F#4": "Fs4.mp3",
                A4: "A4.mp3",
                C5: "C5.mp3",
                "D#5": "Ds5.mp3",
                "F#5": "Fs5.mp3",
                A5: "A5.mp3",
                C6: "C6.mp3",
                "D#6": "Ds6.mp3",
                "F#6": "Fs6.mp3",
                A6: "A6.mp3",
                C7: "C7.mp3",
                "D#7": "Ds7.mp3",
                "F#7": "Fs7.mp3",
                A7: "A7.mp3",
                C8: "C8.mp3",
            },
            release: 1,
            baseUrl: "https://tonejs.github.io/audio/salamander/",
        }).toDestination();
        
          var part = new Tone.Part(function(time, value) {
            synths[i].triggerAttackRelease(value.name, value.duration, time, value.velocity);
          }, midi.tracks[i].notes).start();
        }
      
        setupPlayer();
      }

      function setupPlayer() {
        // Enable the playToggle button
        // Enable the playToggle button by setting the custom attribute to false
        playToggle.attribute('data-disabled', 'false');
      
        // Optionally, you can add an event listener using p5.js if needed
        // playToggle.mousePressed(togglePlay);
      }

      // Function to handle the simulated "change" event
    function handleButtonChange(state) {
        if (state) {
            Tone.Transport.start();
            playToggle.html('❚❚'); // Change button label to 'Pause'
            playToggle.style('background', '#b3cbf2');
        } else {
            Tone.Transport.pause();
            playToggle.html('▶︎'); // Change button label to 'Play'
            playToggle.style('background', '#dcd8d8');
        }
    }
      
      function showPosition() {
        var myPos = Tone.Transport.position;
        var posArray = myPos.split(/\D+/);
        var myBar = Number(posArray[0]) + 1;
        var myBeat = Number(posArray[1]) + 1;
        positionSpan.html(myBar + ":" + myBeat);
      }

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

    

  
    p.draw = function() {
      p.textFont(font);
      p.background(210);

      Tone.Transport.scheduleRepeat(function(time) {
        showPosition();
        ticksSpan.html("Ticks: " + Tone.Transport.ticks);
        bpmSpan.html("BPM: " + Tone.Transport.bpm.value.toFixed());
      }, "8n");
    }
}

// Create the p5 instances
new p5(sketch3D);
new p5(sketch2D);

function hasMidiObjectChanged(newMidiObject) {
    // Simple check if the objects are different
    return JSON.stringify(newMidiObject) !== JSON.stringify(previousMidiObject);
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

