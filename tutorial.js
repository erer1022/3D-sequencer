let font;


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

      let visualizerButton = p.select('#Visualizer');
      visualizerButton.position(20, 100);
  
      let sequencerButton = p.select('#Sequencer');
      sequencerButton.position(20, 160);
  
      let tutorialButton = p.select('#Tutorial');
      tutorialButton.position(20, 220);
      tutorialButton.style('background', '#b3cbf2');
      tutorialButton.style('color', '#000307');

      let NoteDurationTutorial = p.select('#NoteDurationTutorial');
      NoteDurationTutorial.position(180, 50);

      let NotePitchTutorial = p.select('#NotePitchTutorial');
      NotePitchTutorial.position(800, 50);

    }

    p.draw = function() {
        p.textFont(font);
        p.background(210);
      }
}

new p5(sketch2D);



    

    


