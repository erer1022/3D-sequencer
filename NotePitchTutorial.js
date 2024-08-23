let font;
let pianoSynth;
let currentBox;
let currentBall;
let currentTime;
let releaseTime;
let wholeNote;

let noteBoxes = [];
let trackBalls = [];
let note_pitch = [60, 62, 64, 65, 67, 69, 71, 72];
let sketch3DHeight = 800;
let sketch2DHeight = 50;
let defaultPitch = 60;
let baseWidth = 150;
let trackBallBase = 20;

let logo;
let introVisible = false;
let intro;
let closeButton;



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
      cam1.setPosition(0, -700, 1000); // Adjust the position (x, y, z) as needed
      cam1.lookAt(0, 0, 0); // Point the camera at the origin
      p.perspective(p.PI / 3, p.width / p.height, ((p.height / 2) / p.tan(p.PI / 6)) / 10, ((p.height / 2) / p.tan(p.PI / 6)) * 100);

      // -------------------------------------------- set the initial box --------------------------------------------
        

        pianoSynth = new Tone.Sampler({
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

        setNoteBoxesAndTrackBalls();
    }

    function setNoteBoxesAndTrackBalls() {
        for (let i = 0; i < 13; i++) {
            
            let newBox = new NotePitchBox(p.createVector(-600 + i * 90, -400, 0), 1/4, defaultPitch + i); 
            noteBoxes.push(newBox);
            newBox.boxHeight = defaultPitch + i * 8;

            let newTrackBall = new TrackBall(newBox.position);
            trackBalls.push(newTrackBall);
            newTrackBall.x = newBox.position.x;
            newTrackBall.y = newBox.position.y - newBox.boxHeight - trackBallBase;
        } 
    }



    p.draw = function() {
        p.textFont(font);
        p.background(210);
        //p.orbitControl(3);
        
        setCameraArguments(p);

        noteBoxes.forEach(box => {
            box.display(p);
        });

        if (currentBall) {
            updateTrackballAnimation(currentBox, currentBall, releaseTime - currentTime);
            currentBall.display(p);
        }

        

    }

    p.mousePressed = function() {
        for (let i = 0; i < noteBoxes.length; i++) {
            if (noteBoxes[i].isMouseOver(p)) {
                currentBox = noteBoxes[i];
                currentBall = trackBalls[i];
                noteBoxes.forEach (box => {
                    if (box.position.equals(currentBox.position)) {
                        box.isChoosed = true;
                    } else{
                        box.isChoosed = false;
                    }
                });

                const note_pitch = midiNoteToNoteName(noteBoxes[i].pitch);
                const note_duration = convertDurationToToneJS(noteBoxes[i].duration);
                // Get the current Tone.js time
                currentTime = Tone.now();
                pianoSynth.triggerAttackRelease(note_pitch, note_duration);
                releaseTime = currentTime + Tone.Time(note_duration).toSeconds();

                resetTrackballPosition();
            }
        }
    };

    function resetTrackballPosition() {
        currentBall.x = currentBox.position.x;
    }

    function updateTrackballAnimation(noteBox, trackBall, timeDuration) {
        let endPositionX = noteBox.position.x + noteBox.duration * baseWidth;
        let distance = endPositionX - noteBox.position.x;
        let velocity = distance / timeDuration / 60;
        if (trackBall.x < endPositionX) {
            trackBall.x += velocity;
        } else {
            trackBall.x = endPositionX;
        }
        
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
      logo.mousePressed(() => toggleIntro(p));
      logo.mouseOver(() => {
        logo.size(175, 95);
        logo.style('cursor', 'pointer');  // Set cursor to pointer on hover//cursor: pointer;
      });
      logo.mouseOut(() => {
        logo.size(170, 90);
        logo.style('cursor', 'default');  // Reset cursor to default
      });


      let visualizerButton = p.select('#Visualizer');
      visualizerButton.position(20, 100);
  
      let sequencerButton = p.select('#Sequencer');
      sequencerButton.position(20, 160);
  
      let tutorialButton = p.select('#Tutorial');
      tutorialButton.position(20, 220);
      tutorialButton.style('background', '#b3cbf2');
      tutorialButton.style('color', '#000307');

      let noteDurationButton = p.select('#NoteDurationTutorial');
      noteDurationButton.position(1250, 50);

        // -------------------------------------------- playing setting block --------------------------------------------
        let IllustrationSpan = p.createSpan(`
            The <b>PITCH</b> of a note determines how high or low it sounds. <br><br>
           

            Musicians assign different letter names to these pitches: <br>
            C (DO), D (RE), E (MI), F (FA), G (SO), A (LA), and B (TI). <br><br>
            These seven letters represent all the natural notes<br>
             (on a keyboard, these are the <b>WHITE KEYS</b>).<br><br>

            Each note name is followed by its octave number. <br>
            Here, we are showing the 4th octave, the middle octave, and the first note of the 5th octive (C5). <br>
            A sharp sign ("#") indicates that the note is one half step higher than the natural note <br>
            (on a keyboard, these are the <b>BLACK KEYS</b>).<br><br>

            
        `);
        IllustrationSpan.style('width', '900px');
        IllustrationSpan.style('height', '270px');
        IllustrationSpan.style('font-size', '16px');
        IllustrationSpan.position(230, 440);
        let noteDuration = p.createImg('./pictures/note_pitch.png', 'note pitch relationships');
        noteDuration.position(230, 170);
        noteDuration.size(900, 300);

        let reminderSpan = p.createSpan(`
            Click on the box to feel the note pitch!<br>
             In this project, we use the <b>HEIGHT</b> of the boxes to represent the pitch of each note.<br><br>
            `
            );
        reminderSpan.position(200, 20);
        reminderSpan.style('background', 'transparent');
        reminderSpan.style('font-size', '16px');

        let citeSpan = p.createSpan('note pictures from: https://imgbin.com/');
        citeSpan.position(0, 760);
        citeSpan.style('font-size', '10px');
        citeSpan.style('background', 'transparent');
    }

    p.draw = function() {
        p.textFont(font);
        p.background(210);
    }
}

  
    

// Create the p5 instances
new p5(sketch3D);
new p5(sketch2D);

function toggleIntro(p) {
    if (introVisible) {
      hideIntro();
    } else {
      displayIntro(p);
    }
    introVisible = !introVisible;
  }

  function displayIntro(p) {
    intro = p.createSpan(`
      <span style="font-size: 24px; font-weight: bold; color: #b3cbf2;">Welcome!</span> <br><br>
      Music Box is a 3D musical toy that allows you to both visualize and create music using boxes <br><br>
      Start by exploring our tutorial on the relationship between boxes and musical notes on the 
      <a href="./index.html" target="_blank" style="color: #b3cbf2; text-decoration: none;">tutorial page</a>. <br><br>
      Then, go to the <a href="./midiVisualizer.html" target="_blank" style="color: #b3cbf2; text-decoration: none;">visualizer page</a>,
      where you can visualize your own MIDI files or choose from our built-in options to see dynamic music.<br><br>
      Besides, you can go to the <a href="./boxSequencer.html" target="_blank" style="color: #b3cbf2; text-decoration: none;">sequencer page</a>, 
      where you can craft your own compositions by arranging boxes, just like building blocks! <br><br>

      If you want to see this message again after closing it, click on the Music Box Logo!
    `);
    intro.class('intro');
    intro.style('display', 'inline');  // Show all help elements
    intro.position(400, 100);

    closeButton = p.createButton(`Close`);
    closeButton.position(920, 500);
    closeButton.style('font-size', '17px')
    closeButton.mousePressed(() => {
      hideIntro();
      introVisible = !introVisible;
    });
    
  }

  function hideIntro() {
    intro.style('display', 'none');  // Hide all help elements
    closeButton.remove();
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

 // Function to convert MIDI note number to note name
 function midiNoteToNoteName(noteNumber) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteIndex = noteNumber % 12;
    return noteNames[noteIndex] + octave;
  }

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

