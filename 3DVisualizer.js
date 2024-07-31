let font;
let sketch3DHeight = 700;
let sketch2DHeight = 150;
let trackDepth = -100;
let baseWidth = 100;
let boxDepth = 100;

let CW;
let useableMidiObject;
let fileDrop;
let playToggle;
let ticksSpan;
let positionSpan;
let bpmSpan;
let isPlaying = false;
let upButton;
let downButton;
let resetButton;
let rewindButton;
let currentTime;

let trackNoteBoxes = [];
let tracks = [];  // for midi data


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
      cam1.setPosition(500, -600, 800); // Adjust the position (x, y, z) as needed
      cam1.lookAt(500, 0, 0); // Point the camera at the origin
    }

    p.draw = function() {
        p.textFont(font);
        p.background(210);
        p.orbitControl(3);
        setCameraArguments(p);

        if(useableMidiObject) {
            setMidiNoteBoxes(p);
            trackNoteBoxes.forEach(box => { 
                if(box.position.x < p.windowWidth) {
                    //console.log(`box.position.x: ${box.position.x} p.windowWidth: ${p.windowWidth}`)
                    activateNoteBoxes();
                    box.display(p);
                }
            });
        } 
    }

    

    function setMidiNoteBoxes(p) {
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
                let startTime = sortedStartTimes[j];
                let notes = notesByStartTime[startTime];
                boxPosX = (startTime / useableMidiObject.header.ppq) * baseWidth;
                // ppq stands for 1/4
                
                let z = 0;
                
          
                notes.forEach(note => {
                  let noteDuration = note.durationTicks / useableMidiObject.header.ppq / 4;
                  let noteBox = new NoteBox(p.createVector(boxPosX, trackOffset, z), noteDuration, note.midi);
                  noteBox.startTime = note.ticks;
                  trackNoteBoxes.push(noteBox);
                  z += boxDepth;
                  
                });
              }
          }
    }

    function activateNoteBoxes() {
        trackNoteBoxes.forEach(box => {
            if (box.position.x < p.windowWidth) {
            }
            
            if (box.startTime <= currentTime && 
                currentTime < box.startTime + box.duration * 4 * useableMidiObject.header.ppq) {
                    box.isActivate = true;
                } else {
                    box.isActivate = false;
                }
            
        })
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
    }

    function rewindMusic() {
        if (Tone.Transport.state === 'started') {
            Tone.Transport.stop();
            Tone.Transport.position = '0:0:0';
            Tone.Transport.start();
          } else {
            Tone.Transport.stop();
            Tone.Transport.position = '0:0:0';
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
            playToggle.html('◼︎'); // Change button label to 'Pause'
        } else {
            Tone.Transport.pause();
            playToggle.html('▶︎'); // Change button label to 'Play'
        }
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
          const midi = new Midi(e.target.result);
          useableMidiObject = parseMidi(midi);
          makeSong(useableMidiObject);
        };
        reader.readAsArrayBuffer(file);
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
          synths[i] = new Tone.Synth();
          synths[i].oscillator.type = "sine";
          synths[i].toDestination();
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
        currentTime = Tone.Transport.ticks;
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

// Function to handle mouse wheel for zooming
function mouseWheel(event) {
    // Zoom in and out
    zoomLevel += event.delta * -0.001; // Adjust the zoom level based on the scroll amount
    zoomLevel = constrain(zoomLevel, 0.5, 2); // Constrain the zoom level to prevent it from getting too close or too far
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

