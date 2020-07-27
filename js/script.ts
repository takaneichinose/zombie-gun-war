//------------------------------------------------------------ENUMERATIONS

enum Keys {
  Space = 32,
  Left = 37,
  Up = 38,
  Right = 39,
  Down = 40
}

enum ScrData {
  Width = 100,
  Height = 100
}

enum Character {
  Width = 10,
  Height = 15
}

enum Fire {
  Width = 5,
  Height = 5
}

enum Which {
  Player = 0,
  Computer = 1
}

enum Difficulty {
  Easy = 0,
  Medium = 1,
  Hard = 2
}

enum MoveReactionTime {
  Easy = 750,
  Medium = 350,
  Hard = 100
}

enum FireReactionTime {
  Easy = 800,
  Medium = 500,
  Hard = 150
}

enum DodgeThreshold {
  Easy = 5,
  Medium = 10,
  Hard = 15
}

enum MoveLocation {
  Left = 0,
  Right = 1
}

enum DisplaySteps {
  Top = 0,
  Instructions = 1,
  Difficulty = 2,
  Score = 3,
  Start = 4,
  Play = 5,
  End = 6
}

enum Control {
  Width = 2,
  Height = 2,
  BorderWidth = 0.25
}

//------------------------------------------------------------CONSTANTS

const ONE_SECOND = 1000;
const FPS = 24;
const SCREEN_EDGE = ScrData.Width - Character.Width;
const MOVE_SPEED = 0.8;
const BASIC_UNIT = "vmin";
const TEXT_UNIT = "em";
const FIRE_INTERVAL = 300;
const FIRE_SPEED = 1.2;
const ENDING_ANIMATION = 2000;

let app: object = new Vue({
  el: "#app",
  data: {
    keys: {
      space: Keys.Space,
      left: Keys.Left,
      up: Keys.Up,
      right: Keys.Right,
      down: Keys.Down
    },
    screen: {
      width: ScrData.Width + BASIC_UNIT,
      height: ScrData.Height + BASIC_UNIT
    },
    control: {
      width: Control.Width + TEXT_UNIT,
      height: Control.Height + TEXT_UNIT,
      borderWidth: Control.BorderWidth + TEXT_UNIT
    },
    wall: {
      player: {
        bottom: 0
      },
      computer: {
        top: Character.Height + BASIC_UNIT
      }
    },
    play: false,
    currentTime: 0,
    lastRenderTime: 0,
    activeKey: {
      Player: null,
      Computer: null
    },
    player: {
      width: 0,
      height: 0,
      left: 0
    },
    computer: {
      width: 0,
      height: 0,
      left: 0
    },
    location: {
      Player: 0,
      Computer: 0
    },
    fires: {
      Player: [],
      Computer: []
    },
    lastFireTime: {
      Player: 0,
      Computer: 0
    },
    ai: {
      difficulty: null,
      moveCurrentTime: 0,
      moveReactionTime: 0,
      fireCurrentTime: 0,
      fireReactionTime: 0,
      dodgeThreshold: 0
    },
    points: {
      Player: 0,
      Computer: 0
    },
    displaySteps: {
      top: DisplaySteps.Top,
      instructions: DisplaySteps.Instructions,
      difficulty: DisplaySteps.Difficulty,
      score: DisplaySteps.Score,
      start: DisplaySteps.Start,
      play: DisplaySteps.Play,
      end: DisplaySteps.End
    },
    displayStep: 0,
    selectDifficulty: [
      Difficulty[Difficulty.Easy],
      Difficulty[Difficulty.Medium],
      Difficulty[Difficulty.Hard]
    ],
    currentOption: 0,
    stepMenuCount: [0, 0, 3, 5, 0, 0, 0],
    winningScore: [10, 20, 30, 40, 50],
    maxScore: 0,
    winMessage: null,
    ending: false
  },
  methods: {
    //------------------------------------------------------------HELPERS
    // Randomize number with start and end
    randomize(start: number, end: number): number {
      return Math.round(Math.random() * (end - start) + start);
    },
    // Get the lapsed time
    timeLapse(currentTime: number): number {
      return this.currentTime - currentTime;
    },
    // Game loop function (Just a simple iteration)
    gameLoop(): void {
      setTimeout(() => {
        if (this.play === true) {
          window.requestAnimationFrame(this.gameLoop);

          this.currentTime = performance.now();

          this.moveCharacter(Which[Which.Player]);
          this.moveFire(Which[Which.Player]);
          this.fireCollision(Which[Which.Player], 0, 0);
          this.computerAction();
          this.moveCharacter(Which[Which.Computer]);
          this.moveFire(Which[Which.Computer]);
          this.fireCollision(Which[Which.Computer], 0, 0);

          if (this.currentTime - this.lastRenderTime > ONE_SECOND / FPS) {
            this.lastRenderTime = this.currentTime;

            this.renderCharacters();
            this.renderFires();
          }
        }
      }, 0);
    },
    //------------------------------------------------------------CHARACTER
    // Set the character's initial size
    initializeCharactersSize(): void {
      let width: string = Character.Width + BASIC_UNIT;
      let height: string = Character.Height + BASIC_UNIT;

      this.player.width = width;
      this.player.height = height;

      this.computer.width = width;
      this.computer.height = height;
    },
    // Set the character's initial position
    initializeCharactersPosition(): void {
      let end: number = SCREEN_EDGE * 100;
      let player: number = this.randomize(0, end) / 100;
      let computer: number = this.randomize(0, end) / 100;

      this.location.Player = player;
      this.location.Computer = computer;
    },
    // Set the initial fire values
    initializeFire(): void {
      this.fires = {
        Player: [],
        Computer: []
      };
    },
    // Set the initial score
    initializeScore(): void {
      this.points = {
        Player: 0,
        Computer: 0
      };
    },
    // Do all the initialize commands
    initializeAll(): void {
      this.initializeCharactersSize();
      this.initializeCharactersPosition();
      this.initializeFire();
      this.initializeScore();

      this.displayStep = 0;
    },
    // Move the character's location to another point
    moveCharacter(which: string): void {
      switch (this.activeKey[which]) {
        case Keys.Left:
          if (this.location[which] - MOVE_SPEED <= 0) {
            this.location[which] = 0;

            break;
          }

          this.location[which] -= MOVE_SPEED;

          break;
        case Keys.Right:
          if (this.location[which] + MOVE_SPEED >= SCREEN_EDGE) {
            this.location[which] = SCREEN_EDGE;

            break;
          }

          this.location[which] += MOVE_SPEED;

          break;
        default:
          return;
      }
    },
    // Move the computer's position
    computerPosition(): boolean {
      if (this.computerFiringGap() === true) {
        this.activeKey.Computer = null;

        return true;
      }

      if (this.location.Computer <= this.location.Player) {
        this.activeKey.Computer = Keys.Right;
      } else {
        this.activeKey.Computer = Keys.Left;
      }

      this.ai.fireCurrentTime = this.currentTime;

      return false;
    },
    // Render the characters into their respective locations
    renderCharacters(): void {
      this.player.left = this.location.Player + BASIC_UNIT;
      this.computer.left = this.location.Computer + BASIC_UNIT;
    },
    //------------------------------------------------------------FIRE
    // Set the fire's initial position when summoned
    initializeFirePosition(which: string): void {
      let fireTime: number = this.currentTime;
      let lastFire: number = this.lastFireTime[which];

      if (fireTime - lastFire < FIRE_INTERVAL) {
        return;
      }

      if (this.fires[which].length < 2) {
        this.lastFireTime[which] = fireTime;

        let x: number =
          this.location[which] + Character.Width / 2 - Fire.Width / 2;
        let y: number = Character.Height;

        if (which === Which[Which.Player]) {
          y = ScrData.Height - Character.Height - Fire.Height;
        }

        this.fires[which].push({
          x: x,
          y: y,
          style: {
            top: y + BASIC_UNIT,
            left: x + BASIC_UNIT,
            width: Fire.Width + BASIC_UNIT,
            height: Fire.Height + BASIC_UNIT
          }
        });
      }
    },
    // Launch the fire
    launchFire(which: string): void {
      this.initializeFirePosition(which);
    },
    // Move the fire's location to another point
    moveFire(which: string): void {
      let fireSpeed: number = FIRE_SPEED;

      if (which === Which[Which.Player]) {
        fireSpeed *= -1;
      }

      for (let i in this.fires[which]) {
        this.fires[which][i].y += fireSpeed;

        let fire: object = this.fires[which][i];

        if (which === Which[Which.Player] && fire.y + Fire.Height < 0) {
          this.fires[which].splice(i, 1);
        } else if (which === Which[Which.Computer] && fire.y > ScrData.Height) {
          this.fires[which].splice(i, 1);
        }
      }
    },
    // Render fire sprite into their respective locations
    renderFires(): void {
      let whichArray: string[] = [Which[Which.Player], Which[Which.Computer]];

      for (let i in whichArray) {
        let which: string = whichArray[i];

        for (let j in this.fires[which]) {
          let fire: object = this.fires[which][j];

          this.fires[which][j].style.top = fire.y + BASIC_UNIT;
        }
      }
    },
    // Fire collision
    fireCollision(which: string, advance: number, prediction: number): number {
      let otherWhich: string = Which[Which.Computer];
      let yCharacter: number = Character.Height;
      let fireHeightHalf: number = Fire.Height / 2;

      if (which === Which[Which.Computer]) {
        otherWhich = Which[Which.Player];
        yCharacter = ScrData.Height - Character.Height;
      }

      for (let i: number = 0; i < this.fires[which].length; i++) {
        let fire: object = this.fires[which][i];
        let x1: number = fire.x;
        let x2: number = x1 + Fire.Width;
        let y: number = fire.y;
        let cX1: number = this.location[otherWhich];
        let cX2: number = cX1 + Character.Width;

        if (prediction !== 0 && this.computerDistanceCheck(i) === true) {
          cX1 -= prediction;
          cX2 -= prediction;
        } else {
          cX1 += prediction;
          cX2 += prediction;
        }

        let xCondition: boolean = x1 <= cX2 && x2 >= cX1;

        y = y + fireHeightHalf - advance;

        if (which === Which[Which.Computer]) {
          if (y > yCharacter && xCondition === true) {
            this.analyzeFire(i, which, advance);

            return i;
          }
        } else {
          if (y < yCharacter && xCondition === true) {
            this.analyzeFire(i, which, advance);

            return i;
          }
        }
      }

      return null;
    },
    // Analyze the fire position, then remove
    analyzeFire(i: number, which: string, advance: number): void {
      if (advance === 0) {
        this.fires[which].splice(i, 1);

        this.points[which]++;
      }

      if (this.points[which] === this.winningScore[this.maxScore]) {
        this.play = false;

        if (which === Which[Which.Computer]) {
          let aiType: string = Difficulty[this.ai.difficulty];

          this.winMessage = "You lose! " + which + " (" + aiType + ")";
        } else {
          this.winMessage = "Congratulations! You";
        }

        this.ending = true;

        let timeout: number = setTimeout(() => {
          this.ending = false;

          this.displayStep++;

          clearTimeout(timeout);
        }, ENDING_ANIMATION);
      }
    },
    //------------------------------------------------------------ACTION
    // Set the key that is being hold
    setActiveKey(key: Keys): void {
      if (this.activeKey.Player === null) {
        this.activeKey.Player = key;

        this.ai.moveCurrentTime = this.currentTime;
      }
    },
    // Clear the active key
    clearActiveKey(key: Keys): void {
      if (key === this.activeKey.Player) {
        this.activeKey.Player = null;
      }
    },
    // Set the computer's difficulty
    setComputerDifficulty(): void {
      let difficulty: string = Difficulty[this.ai.difficulty];

      this.ai.moveReactionTime = MoveReactionTime[difficulty];
      this.ai.fireReactionTime = FireReactionTime[difficulty];
      this.ai.dodgeThreshold = DodgeThreshold[difficulty];
    },
    // Trigger for all of the computer's function
    computerAction(): void {
      if (this.computerDodge() === true) {
        return;
      }

      if (this.computerAvoidFire() === true) {
        return;
      }

      let moveElapsedTime: number = this.timeLapse(this.ai.moveCurrentTime);

      if (moveElapsedTime < this.ai.moveReactionTime) {
        this.activeKey.Computer = null;

        return;
      }

      if (this.computerPosition() === true) {
        this.computerLaunchFire();
      }
    },
    // Make the AI to launch a fire
    computerLaunchFire(): void {
      let fireElapsedTime: number = this.timeLapse(this.ai.fireCurrentTime);

      if (fireElapsedTime < this.ai.fireReactionTime) {
        return;
      }

      this.launchFire(Which[Which.Computer]);
    },
    // Make the AI dodge the player's fire
    computerDodge(): boolean {
      let fireIndex: number = this.fireCollision(
        Which[Which.Player],
        this.ai.dodgeThreshold,
        0
      );

      if (fireIndex !== null) {
        if (this.computerDistanceCheck(fireIndex) === true) {
          this.activeKey.Computer = Keys.Right;
        } else {
          this.activeKey.Computer = Keys.Left;
        }

        return true;
      }

      return false;
    },
    // Make the computer avoid the incoming fire
    computerAvoidFire(): boolean {
      let fireIndex: number = this.fireCollision(
        Which[Which.Player],
        this.ai.dodgeThreshold,
        Fire.Width
      );

      if (fireIndex !== null) {
        this.activeKey.Computer = null;

        this.computerLaunchFire();

        return true;
      }

      return false;
    },
    // Gap within the player for the AI to launch a fire
    computerFiringGap(): boolean {
      let computerLocation: number = this.location.Computer;
      let playerLocation: number = this.location.Player;
      let fullWidth: number = Character.Width;
      let halfWidth: number = fullWidth / 2;

      return (
        computerLocation >= playerLocation - halfWidth &&
        computerLocation <= playerLocation + fullWidth - halfWidth
      );
    },
    // Check the distance between the fire and center of computer
    computerDistanceCheck(fireIndex: number): boolean {
      let x: number = this.location.Computer + Character.Width / 2;
      let f1: number = this.fires.Player[fireIndex].x;
      let f2: number = f1 + Fire.Width;
      let d1: number = Math.abs(x - f1);
      let d2: number = Math.abs(x - f2);

      return d1 > d2;
    },
    // Set the game controls for playing status
    setPlayControlsDown(key: Keys): void {
      switch (key) {
        case Keys.Left:
          this.setActiveKey(Keys.Left);

          break;
        case Keys.Right:
          this.setActiveKey(Keys.Right);

          break;
      }
    },
    // Set the game controls for menu status
    setMenuControlsDown(key: Keys): void {
      switch (key) {
        case Keys.Up:
          this.selectMenu(Keys.Up);

          break;
        case Keys.Down:
          this.selectMenu(Keys.Down);

          break;
      }
    },
    // Set the game controls for playing status
    setPlayControlsUp(key: Keys): void {
      switch (key) {
        case Keys.Space:
          this.launchFire(Which[Which.Player]);

          break;
        case Keys.Left:
          this.clearActiveKey(key);

          break;
        case Keys.Right:
          this.clearActiveKey(key);

          break;
      }
    },
    // Set the game controls for menu status
    setMenuControlsUp(key: Keys): void {
      switch (key) {
        case Keys.Space:
          this.confirmMenu();

          break;
      }
    },
    // Set the game controls
    setControls(): void {
      window.addEventListener("keydown", (e) => {
        if (this.play === true) {
          this.setPlayControlsDown(e.keyCode);
        } else {
          this.setMenuControlsDown(e.keyCode);
        }
      });

      window.addEventListener("keyup", (e) => {
        if (this.play === true) {
          this.setPlayControlsUp(e.keyCode);
        } else {
          this.setMenuControlsUp(e.keyCode);
        }
      });
    },
    //------------------------------------------------------------INTERFACE EVENTS
    // Select item from the menu
    selectMenu(key: Keys): void {
      let count: number = this.stepMenuCount[this.displayStep];
      let option: number = null;

      if (key === Keys.Up) {
        option = -1;
      } else if (key === Keys.Down) {
        option = 1;
      } else {
        return;
      }

      switch (this.currentOption + option) {
        case -1:
          this.currentOption = count - 1;

          break;
        case count:
          this.currentOption = 0;

          break;
        default:
          this.currentOption += option;

          break;
      }
    },
    // Confirm the selected item from the menu
    confirmMenu(): void {
      if (this.ending === true) {
        return;
      }

      if (this.displayStep === DisplaySteps.Difficulty) {
        this.ai.difficulty = this.currentOption;

        this.setComputerDifficulty();

        this.currentOption = 0;
      } else if (this.displayStep === DisplaySteps.Score) {
        this.maxScore = this.currentOption;

        this.currentOption = 0;
      } else if (this.displayStep === DisplaySteps.End) {
        this.initializeAll();

        return;
      }

      this.displayStep++;

      if (this.displayStep === DisplaySteps.Play) {
        this.currentOption = 0;
        this.winMessage = null;

        this.play = true;
        this.gameLoop();

        return;
      }
    },
    // Mousedown event on screen buttons
    mouseActionDown(key: Keys) {
      if (this.play === true) {
        this.setPlayControlsDown(key);
      } else {
        this.setMenuControlsDown(key);
      }
    },
    // Mouseup event on screen buttons
    mouseActionUp(key: Keys) {
      if (this.play === true) {
        this.setPlayControlsUp(key);
      } else {
        this.setMenuControlsUp(key);
      }
    }
  },
  created(): void {
    this.setControls();
    this.initializeAll();
  }
});
