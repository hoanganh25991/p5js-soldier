// Pillar Module

export class Pillar {
  constructor(gameState) {
    this.gameState = gameState;
  }

  show() {
    push();
    translate(0, 25 - this.gameState.pillarHeight * 2.5, 0);
    fill(150);
    box(80, this.gameState.pillarHeight * 5, 80); // Wider pillar
    // Add visual markers on pillar
    for (let i = 0; i < 5; i++) {
      push();
      translate(0, this.gameState.pillarHeight * 2.5 - i * this.gameState.pillarHeight, 0);
      fill(100);
      box(82, 2, 82); // Match pillar width
      pop();
    }
    pop();
  }
}