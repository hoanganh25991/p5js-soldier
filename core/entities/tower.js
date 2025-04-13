// Tower Module

export class Tower {
  constructor(gameState) {
    this.gameState = gameState;
  }

  show() {
    push();
    translate(0, 25 - this.gameState.towerHeight * 2.5, 0);
    fill(150);
    box(80, this.gameState.towerHeight * 5, 80); // Wider tower
    // Add visual markers on tower
    for (let i = 0; i < 5; i++) {
      push();
      translate(0, this.gameState.towerHeight * 2.5 - i * this.gameState.towerHeight, 0);
      fill(100);
      box(82, 2, 82); // Match tower width
      pop();
    }
    pop();
  }
}