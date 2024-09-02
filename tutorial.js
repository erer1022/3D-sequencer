let font;
let introVisible = true;
let intro;
let closeButton;


function preload() {
    font = loadFont('./Roboto/Roboto-Black.ttf');
  }

let sketch2D = function(p) {
    p.preload = function() {
      font = p.loadFont('./Roboto/Roboto-Black.ttf');
    }
  
    p.setup = function() {
      p.createCanvas(p.windowWidth, p.windowHeight).parent('2d-container');
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

      let NoteDurationTutorial = p.select('#NoteDurationTutorial');
      NoteDurationTutorial.position(400, 150);

      let NotePitchTutorial = p.select('#NotePitchTutorial');
      NotePitchTutorial.position(800, 150);

      displayIntro(p);
    }

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

    p.draw = function() {
        p.textFont(font);
        p.background(210);

        
    }
}

new p5(sketch2D);



    

    


