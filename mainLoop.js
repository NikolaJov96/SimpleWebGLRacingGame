// Getting reference to the info label
var label = document.getElementById("label");

// Track map definition 
//   1 - wall, 0 - road
var racingTrack = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 1, 1],
    [1, 0, 0, 1, 1, 1, 0, 0, 1],
    [1, 1, 0, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1]
]

// Getting map dimensions
var width = racingTrack[0].length
var height = racingTrack.length

// Defining initial state of two players
var player = [
    {
        x: 4.0,
        y: 1.3,
        vel: 0.0,
        dir: 0.0,
        left: false,
        right: false,
        break: false,
        accel: false,
        lost: false,
        firstCell: true,
        laps: 0
    },
    {
        x: 4.0,
        y: 1.6,
        vel: 0.0,
        dir: 0.0,
        left: false,
        right: false,
        break: false,
        accel: false,
        lost: false,
        firstCell: true,
        laps: 0
    }
]

// Laps to win
var LAPS_GOAL = 5;

// On key pressed down, recored it is down
document.onkeydown = function(event) {
    if (event.key === 'a') player[0].left = true;
    if (event.key === 's') player[0].break = true;
    if (event.key === 'd') player[0].right = true;
    if (event.key === 'w') player[0].accel = true;
    if (event.key === 'j') player[1].left = true;
    if (event.key === 'k') player[1].break = true;
    if (event.key === 'l') player[1].right = true;
    if (event.key === 'i') player[1].accel = true;
};

// On key released, recored it is not down
document.onkeyup = function(event) {
    if (event.key === 'a') player[0].left = false;
    if (event.key === 's') player[0].break = false;
    if (event.key === 'd') player[0].right = false;
    if (event.key === 'w') player[0].accel = false;
    if (event.key === 'j') player[1].left = false;
    if (event.key === 'k') player[1].break = false;
    if (event.key === 'l') player[1].right = false;
    if (event.key === 'i') player[1].accel = false;
};

// Function updating info lable to display number 
//   of laps completed by both players
var updateLabel = function() {
    label.innerHTML = "(" + (player[0].laps + 1) + "/" + LAPS_GOAL + 
        ") P1 vs P2 (" + 
        (player[1].laps + 1) + "/" + LAPS_GOAL + ")";
}
// Update now
updateLabel();

// Function drawing object using prepared transformation matrix
// Drawing on gl contex with id=0/1
var drawObject = function (texture, id) {
    // Prepare or "bind" desired object and texture
    gl[id].bindBuffer(gl[id].ARRAY_BUFFER, objs["square"].VBO[id]);
    gl[id].bindBuffer(gl[id].ELEMENT_ARRAY_BUFFER, objs["square"].IBO[id]);
    gl[id].bindTexture(gl[id].TEXTURE_2D, shapeTextures[id][texture]);
    gl[id].activeTexture(gl[id].TEXTURE0);
    gl[id].uniform1i(programInfo[id].samplerUnifLoc, 0);
    gl[id].vertexAttribPointer(
        programInfo[id].posAttribLoc, 3, gl[id].FLOAT, gl[id].FALSE, 
        5 * Float32Array.BYTES_PER_ELEMENT, 0
    );
    gl[id].vertexAttribPointer(
        programInfo[id].coordAttribLoc, 2, gl[id].FLOAT, gl[id].FALSE, 
        5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT
    );

    // Calculate view matrix so that iy is looking at the car from up and behind
    mat4.lookAt(self.viewMatrix, 
        [
            player[id].x - Math.cos(Math.PI * player[id].dir / 180.0) * 2, 
            player[id].y - Math.sin(Math.PI * player[id].dir / 180.0) * 2, 
            1.0
        ],
        [
            player[id].x + Math.cos(Math.PI * player[id].dir / 180.0) * 0.5, 
            player[id].y + Math.sin(Math.PI * player[id].dir / 180.0) * 0.5, 
            0.0
        ],  
        [0, 0, 1]
    );

    // Copy uniform data to GPU
    gl[id].uniformMatrix4fv(programInfo[id].matProjUnifLoc, gl[id].FALSE, self.projMatrix);
    gl[id].uniformMatrix4fv(programInfo[id].matViewUnifLoc, gl[id].FALSE, self.viewMatrix);
    gl[id].uniformMatrix4fv(programInfo[id].matTranUnifLoc, gl[id].FALSE, self.tranMatrix);

    // Run shaders and draw object
    gl[id].drawElements(gl[id].TRIANGLES, squareShape.ind.length, gl[id].UNSIGNED_SHORT, 0);
}

// Function rendering the scene
function drawGame() {
    // Clearing both contextes
    gl[0].clear(gl[0].DEPTH_BUFFER_BIT | gl[0].COLOR_BUFFER_BIT);
    gl[1].clear(gl[1].DEPTH_BUFFER_BIT | gl[1].COLOR_BUFFER_BIT);

    // Draw cars
    for (var i = 0; i < 2; i++) {
        mat4.fromTranslation(self.tranMatrix, [player[i].x, player[i].y, 0.0]);
        mat4.rotate(self.tranMatrix, self.tranMatrix, Math.PI * player[i].dir / 180.0, [0.0, 0.0, 1.0]);
        mat4.scale(self.tranMatrix, self.tranMatrix, [0.2, 0.1, 1.0]);
        
        // Draw car on both contextes (canvases)
        for (var j = 0; j < 2; j++) {
            if (i == 0) drawObject("green", j);
            else drawObject("red", j);
        }
    }
    // Go through the track map and draw all the walls
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {
            if (racingTrack[y][x] === 0) continue;

            mat4.fromTranslation(self.tranMatrix, [x + 0.5, y + 0.5, 0.0]);
            mat4.scale(self.tranMatrix, self.tranMatrix, [0.9, 0.9, 1.0]);
            
            for (var j = 0; j < 2; j++) {
                drawObject("white", j);
            }
        }
    }
}

// Main loop, called whe system signals it is ready to draw to screen
var mainLoop = function(){
    // Run only is the game is not ower
    if ((!player[0].lost) && (!player[1].lost)) {
        // Do the same for both players
        for (var i = 0; i < 2; i++) {
            // Read stored info about user input and
            //   update player speed and direction
            if (player[i].left) {
                player[i].dir += 2;
                if (player[i].dir > 360) player[i].dir -= 360; 
            }
            if (player[i].right) {
                player[i].dir -= 2;
                if (player[i].dir < 0) player[i].dir += 360; 
            }
            if (player[i].accel) {
                player[i].vel += 0.001;
            }
            if (player[i].break) {
                player[i].vel -= 0.001;
            }
            // Decrease velocity by little
            player[i].vel *= 0.995;
            // Update player position on the map
            player[i].x += player[i].vel * Math.cos(Math.PI * player[i].dir / 180.0);
            player[i].y += player[i].vel * Math.sin(Math.PI * player[i].dir / 180.0);
            matX = Math.floor(player[i].x);
            matY = Math.floor(player[i].y);
            // If player has collided with wall, he lost 
            if (racingTrack[matY][matX] === 1) {
                player[i].lost = true;
            }
            // Check if player has completed the whole lap 
            //   (not perfect solution, can be cheated)
            if (matX !== 4 || matY !== 1) {
                player[i].firstCell = false;
            }
            if (matX === 4 && matY === 1 && !player[i].firstCell) {
                player[i].laps++;
                // Update ino label
                updateLabel();
                if (player[i].laps >= LAPS_GOAL) {
                    player[(i + 1) % 2].lost = true;
                }
            }
            if (matX === 4 && matY === 1) {
                player[i].firstCell = true;
            }
        }
        // If the game is over, displey the info message
        if (player[0].lost && player[1].lost) label.innerHTML = "Both players lose!";
        else if (player[0].lost) label.innerHTML = "Player 2 won!";
        else if (player[1].lost) label.innerHTML = "Player 1 won!";
        drawGame();   
    }
    window.requestAnimationFrame(mainLoop);
};
window.requestAnimationFrame(mainLoop);
