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
let camZ = 0;
let targetX;
let targetY;
let camSpeed = 0;
let defaultPitch = 60;


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
let helpVisible = true;
let useOrbitControl = false;
let audioContext = null;

let upButton;
let downButton;
let resetButton;
let rewindButton;
let builtInButton;
let helpButton;
let visualizerButton;
let sequencerButton;
let tutorialButton;
let currentTime;
let currentTimeInSeconds;
let myBar;
let lastBarValue = 0;
let logo;

let bars = [];
let trackNoteBoxes = [];
let tracks = [];  // for midi data
let builtInMidis = [];
let helps = [];
let spans = [];
let buttons = [];

let boxSynth;
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
    // logo = loadImage('./pictures/logo.png');
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

      setBoxSynth();
    }

    p.draw = function() {
        p.textFont(font);
        p.background(210);
        p.frameRate(120);
        setCameraArguments(p);

        // Make sure the set procedure only conduct once, otherwise the computations is so heavy, it will influence the performance
        if (useableMidiObject && !useableMidiObjectParsed) {
            setMidiNoteBoxes(p);
            useableMidiObjectParsed = true; // Set the flag to true after parsing
        }

        if (useableMidiObject) {
            activateNoteBoxes();
            trackNoteBoxes.forEach(box => { 
                    if (box.position.x > camX - p.windowWidth && box.position.x < camX + p.windowWidth) {
                      box.display(p);
                    }
            });
        } 

        updateCurrentTimeInTicks();
        // Automatically move the camera horizontally
            let distanceX = targetX - camX;
            let velocityX = distanceX / 60;

            if (velocityX) {
                camX += velocityX;
            }

            if (!isPlaying) {
              p.orbitControl(1);
              camY = cam1.eyeY
              camZ = cam1.eyeZ;
            }

            if (camY === 0) {
              camY = -2000;
              camZ = 1000;
            }

            cam1.setPosition(camX, camY, camZ);
            cam1.lookAt(camX, 0, 0); // Point the camera at the moving x position
    }

    function activateNoteBoxes() {
      trackNoteBoxes.forEach(box => {
          if (currentTime && box.startTime <= currentTime && 
              currentTime < box.endTime) {
                  box.isActivate = true;
                  targetX = box.position.x;
              } else {
                  box.isActivate = false;
              }
      });
  }

    p.mousePressed = function() {
      for (let i = 0; i < trackNoteBoxes.length; i++) {
        if (trackNoteBoxes[i].isMouseOver(p)) {
          let noteName = midiNoteToNoteName(trackNoteBoxes[i].pitch);
          let noteDuration = convertDurationToToneJS(trackNoteBoxes[i].duration);
          boxSynth.triggerAttackRelease(noteName, noteDuration);
        }
      }
    }

    p.mouseDragged = function() {
      if (!isPlaying) {
        camX += (p.pmouseX - p.mouseX);
      }
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
            let trackOffset = -300 + i * trackDepth;
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
                    // set noteBox's startTime and endTime
                    noteBox.startTime = note.ticks;
                    noteBox.endTime = note.ticks + note.durationTicks;
                    trackNoteBoxes.push(noteBox);
                    z += boxDepth;
                  
                });
              }
          }
    }

    function setBoxSynth() {
      boxSynth = new Tone.Sampler({
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
  }

}

let sketch2D = function(p) {
    p.preload = function() {
      font = p.loadFont('./Roboto/Roboto-Black.ttf');
    }
  
    p.setup = function() {
      p.createCanvas(p.windowWidth, sketch2DHeight).parent('2d-container');
      logo = p.createImg('./pictures/logo.png', 'logo');
      logo.position(0, 0);
      logo.size(170, 90);

      visualizerButton = p.select('#Visualizer');
      visualizerButton.style('background', '#b3cbf2');
      visualizerButton.style('color', '#000307');
      buttons.push({ button: visualizerButton, xPercent: 0.015, yPercent: 0.15});
  
      sequencerButton = p.select('#Sequencer');
      buttons.push({ button: sequencerButton, xPercent: 0.015, yPercent: 0.23});

      tutorialButton = p.select('#Tutorial');
      buttons.push({ button: tutorialButton, xPercent: 0.015, yPercent: 0.31});

      helpButton = p.select('#Help');
      helpButton.style('background', '#b3cbf2');
      displayHelp(p);
      helpButton.mousePressed(() => toggleHelpButton(p));
      buttons.push({ button: helpButton, xPercent: 0.015, yPercent: 0.39});

      // Setup tooltips
      setupTooltips();

      CW = CW || {};
      CW.tempoOffset = 0;

        fileDrop = p.createFileInput(handleMidiFile);
        fileDrop.position(p.windowWidth * 0.17, p.windowHeight / 13 * 1.5);
        // Use the changed method to handle new file upload
        fileDrop.changed(() => {
            let file = fileDrop.elt.files[0];
            if (file) {
                handleMidiFile(file);
            }
        });

        // -------------------------------------------- Tone.Transportation data --------------------------------------------
        

        // Create a span for BPM
        bpmSpan = p.createSpan('BPM: 0');
        //bpmSpan.position(p.windowWidth / 12 * 8.8, p.windowHeight / 13 * 2.8);
        spans.push({ span: bpmSpan, xPercent: 0.73, yPercent: 0.22, wPercent: 0.07, hPercent: 0.023  });

        // -------------------------------------------- tempo setting block
        let tempoSpan = p.createSpan(`TEMPO SETTING:`);
        tempoSpan.style('width', '340px');
        tempoSpan.style('height', '150px');
        spans.push({ span: tempoSpan, xPercent: 0.7, yPercent: 0.08, wPercent: 0.24, hPercent: 0.2 }); 

        upButton = p.createButton(`UP`);
        upButton.attribute('disabled', '');
        upButton.mousePressed(() => changeTempo(`UP`));
        
        buttons.push({ button: upButton, xPercent: 0.73, yPercent: 0.14 });

        downButton = p.createButton(`DOWN`);
        downButton.attribute('disabled', '');
        downButton.mousePressed(() => changeTempo(`DOWN`));
        buttons.push({ button: downButton, xPercent: 0.79, yPercent: 0.14 });

        resetButton = p.createButton(`RESET`);
        resetButton.attribute('disabled', '');
        resetButton.mousePressed(() => changeTempo(`RESET`));
        buttons.push({ button: resetButton, xPercent: 0.87, yPercent: 0.14 });

        // -------------------------------------------- playing setting block --------------------------------------------
        let playSpan = p.createSpan(`PLAY SETTING:`);
        let width = p.windowWidth * 0.22;
        spans.push({ span: playSpan, xPercent: 0.4, yPercent: 0.08, wPercent: 0.22, hPercent: 0.2 }); 

        ticksSpan = p.createSpan(`Ticks: 0`);
        spans.push({ span: ticksSpan, xPercent: 0.52, yPercent: 0.22, wPercent: 0.07, hPercent: 0.023  }); 

        // Create a span for position
        positionSpan = p.createSpan('Position 0:0');
        spans.push({ span: positionSpan, xPercent: 0.42, yPercent: 0.22, wPercent: 0.07, hPercent: 0.023 }); 


        playToggle = p.createButton('▶︎');
        buttons.push({ button: playToggle, xPercent: 0.42, yPercent: 0.14 }); 
        playToggle.attribute('disabled', 'true');

        // Adding mousePressed event listener to the button
        playToggle.mousePressed(() => {
          if (!audioContext) {
              audioContext = new (window.AudioContext || window.webkitAudioContext)();
          } else if (audioContext.state === 'suspended') {
              audioContext.resume();
          }

          // Check if the button is disabled
          if (playToggle.elt.hasAttribute('disabled')) {
              isPlaying = false;
              alert("Please upload a MIDI file or choose built-in files to play music");
          } else {
              isPlaying = !isPlaying;
              handleButtonChange(isPlaying);
          }
        });

        rewindButton = p.createButton(`REWIND`);
        rewindButton.attribute('disabled', '');
        rewindButton.mousePressed(rewindMusic);
        buttons.push({ button: rewindButton, xPercent: 0.47, yPercent: 0.14 }); 

        // -------------------------------------------- Built-ins Setting -------------------------------------------- 
        builtInButton = p.createButton(`🎼 🎵 🎶`);
        builtInButton.mouseOver(() => {
            builtInButton.style('background', '#b3cbf2')
        });
        builtInButton.mousePressed(() => toggleBuiltInOptions(p));
        builtInButton.position(p.windowWidth * 0.17, p.windowHeight / 13 * 2.5);


        // Set initial positions
        spans.forEach(s => {
          setSpanPositionAndSize(s.span, s.xPercent, s.yPercent, s.wPercent, s.hPercent);
        });

        buttons.forEach(b => {
          setButtonPosition(b.button, b.xPercent, b.yPercent);
        });
    }

    function setButtonPosition(button, xPercent, yPercent) {
      let xPos = p.windowWidth * xPercent;
      let yPos = p.windowHeight * yPercent;
      button.position(xPos, yPos);
    }

    function setSpanPositionAndSize(span, xPercent, yPercent, widthPercent, heightPercent) {
      let xPos = p.windowWidth * xPercent;
      let yPos = p.windowHeight * yPercent;
      let width = p.windowWidth * widthPercent;
      let height = p.windowHeight * heightPercent;
      
      span.position(xPos, yPos);
      span.style('width', `${width}px`);
      span.style('height', `${height}px`);
    }

    function windowResized() {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      
      //Update positions of all spans
      spans.forEach(s => {
        setSpanPositionAndSize(s.span, s.xPercent, s.yPercent, s.wPercent, s.hPercent);
      });
    
      // Update positions of all buttons
      buttons.forEach(b => {
        setButtonPosition(b.button, b.xPercent, b.yPercent);
      });
    }
    
    p.windowResized = windowResized;  // Attach the window resize event
    

    function setupTooltips() {
      const buttons = [visualizerButton, sequencerButton, tutorialButton, helpButton];
      const tooltip = p.createDiv('').addClass('tooltip');
      tooltip.hide();
  
      // Tooltip messages for each button
      const tooltips = {
          Visualizer: "Visualizer: <br>Visualize midi file by note boxes! <br>And interact with the boxes!",
          Sequencer: "Sequencer:  <br>Compose the music<br> by building note boxes!",
          Tutorial: "Tutorial: <br>Click to start the tutorial.",
          Help: "Help: <br> Click to see more guidance <br> Click again to close the messages"
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

    function handleButtonChange(state) {
      if (!audioContext) {
          // This is a fallback; ideally, this shouldn't be necessary if initialized properly elsewhere
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
  
      if (audioContext.state === 'suspended') {
          // Resume AudioContext if suspended
          audioContext.resume().then(() => {
              togglePlayback(state);
          }).catch(error => {
              console.error("Error resuming the AudioContext:", error);
          });
      } else {
          togglePlayback(state);
      }
    }

    function togglePlayback(state) {
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

    function displayHelp(p) {
      if (helps.length === 0) {
        let help_builtIn = p.createSpan('STEP 1: <strong>Upload</strong> a midi file or <br> <strong>Choose</strong> a built-in file to visualize it');
        help_builtIn.style('background', 'rgba(251, 251, 251, 0.3)');
        help_builtIn.style('color', '#9db2d4');
        spans.push({ span: help_builtIn, xPercent: 0.17, yPercent: 0.015, wPercent: 0.16, hPercent: 0.045 }); 
        helps.push(help_builtIn);

        let help_play = p.createSpan('STEP 2: Click the "▶︎" button to start the music');
        help_play.style('background', 'rgba(251, 251, 251, 0.3)');
        help_play.style('color', '#9db2d4');
        spans.push({ span: help_play, xPercent: 0.4, yPercent: 0.015, wPercent: 0.22, hPercent: 0.02 }); 
        helps.push(help_play);

        let help_tempo = p.createSpan('STEP 3: Adjust the TEMPO to experience variations');
        help_tempo.style('background', 'rgba(251, 251, 251, 0.3)');
        help_tempo.style('color', '#9db2d4');
        spans.push({ span: help_tempo, xPercent: 0.7, yPercent: 0.015, wPercent: 0.24, hPercent: 0.02 }); 
        helps.push(help_tempo);

        let help_mouse = p.createSpan(`
          Tips: <br><br>
          When the music is NOT playing: <br>
          Adjust the viewpoint by dragging the mouse <br>
          or using the mouse wheel!<br><br>
          Try to click on the box!`);
          help_mouse.style('background', 'rgba(251, 251, 251, 0.3)');
          help_mouse.style('color', '#9db2d4');
          spans.push({ span: help_mouse, xPercent: 0.4, yPercent: 0.4, wPercent: 0.22, hPercent: 0.2 }); 
          helps.push(help_mouse);

          let Tips_refresh = p.createSpan(`
            Tips: <br><br>
            If you experience performance issue<br>
            Try to <strong>refreshing</strong> the page!<br><br>
            <strong>Click the "?" button again to close the messages</strong>`);
            Tips_refresh.style('background', 'rgba(251, 251, 251, 0.3)');
            Tips_refresh.style('color', '#9db2d4');
            spans.push({ span: Tips_refresh, xPercent: 0.7, yPercent: 0.4, wPercent: 0.24, hPercent: 0.2 }); 
            helps.push(Tips_refresh);

            // ---------------------------------- set color indicators ----------------------------------------------------
            let noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            let colors = ['rgba(226, 165, 173, 0.5)', 'rgba(201, 147, 154, 0.5)', 'rgba(237, 205, 206, 0.5)', 'rgba(209, 182, 183, 0.5)', 'rgba(239, 241, 254, 0.5)', 'rgba(246, 246, 246, 0.5)', 'rgba(201, 192, 181, 0.5)', 'rgba(181, 199, 201, 0.5)', 'rgba(195, 217, 219, 0.5)', 'rgba(136, 149, 177, 0.5)', 'rgba(118, 129, 153, 0.5)', 'rgba(84, 108, 140, 0.5)']
            let positionX = 0.03;
            
            for (let i = 0; i < noteNames.length; i++) {
              let newSpan = p.createSpan(`${noteNames[i]}`);
              newSpan.style('background', colors[i]);
              //newSpan.style('width', '3px');
              //newSpan.style('height', '40px');
              newSpan.style('align-items', 'center');
              newSpan.style('justify-content', 'center');
              newSpan.style('display', 'flex');

              //newSpan.position(positionX, p.windowHeight / 13 * 11.5);
              spans.push({ span: newSpan, xPercent: positionX, yPercent: 0.93, wPercent: 0.005, hPercent: 0.02 }); 
              positionX += 0.025;
              helps.push(newSpan);
            }
          } else {
            helps.forEach(help => help.style('display', 'inline'));  // Show all help elements
          }
    }

    function hideHelp() {
      helps.forEach(help => help.style('display', 'none'));  // Hide all help elements
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
            "001-Cherni-139-1",
            "002-Cherni-139-2",
            "003-Bach-Prelude-C",
            "004-Bach-14-Canons",
            "005-Bethoven-For-elise",
            "006-La-La-Land",
            "007-Chopin-Nocturne-in-E-Flat-Opus-9-Nr-2",
            "008-Debussy-Clair-de-lune",
            "009-Debussy-Reverie",
            "010-Canon-3",
            "011-Golden-Hour",
            "012-Mr-Lawrence-Merry-Christmas"
        ];
        let positionY = p.windowHeight / 13 * 3.5;

        midiFiles.forEach((file) => {
            let item = p.createElement('div', file);
            item.mouseOver(() => item.style('background-color', '#555'));
            item.mouseOut(() => item.style('background-color', 'rgba(51, 51, 51, 0.05)'));
            item.mousePressed(() => loadBuiltInMidi(p, file));
            item.position(p.windowWidth * 0.17, positionY);
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
        lastBarValue = 0;
        bars = [];
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
        playToggle.removeAttribute('disabled');
        upButton.removeAttribute('disabled');
        downButton.removeAttribute('disabled');
        resetButton.removeAttribute('disabled');
        rewindButton.removeAttribute('disabled');
      }
      
      function showPosition() {
        let myPos = Tone.Transport.position;
        let posArray = myPos.split(/\D+/);
        myBar = Number(posArray[0]) + 1;
        let myBeat = Number(posArray[1]) + 1;
        positionSpan.html(myBar + ":" + myBeat);
      }

      function rewindMusic() {
        Tone.Transport.stop();
        Tone.Transport.position = '0:0:0';
        if (Tone.Transport.state === 'started') {
            Tone.Transport.start();
        }
        targetX = 0;
        lastBarValue = 0;
        bars = [];
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

      if (myBar > lastBarValue) {
        lastBarValue = myBar;
        createRandomBar(p);
      }
      

      // Update and draw all ellipses
      for (let i = bars.length - 1; i >= 0; i--) {
        let bar = bars[i];
        bar.update();
        bar.display(p);

        // Remove the ellipse if it's faded out
        if (bar.alpha <= 0) {
            bars.splice(i, 1);
        }
      }
    }

    function createRandomBar(p) {
      let x = p.random(0, p.windowWidth);
      let y = p.random(0, sketch2DHeight);
      let d = p.random(10, 50);
      bars.push(new Bar(x, y, d, p));
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

