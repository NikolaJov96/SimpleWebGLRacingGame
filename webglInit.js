// Getting references to canvas1 and canvas2
var canvas1 = document.getElementById('canvas1');
var canvas2 = document.getElementById('canvas2');
// Getting gl context 1 and 2
var gl = [
    canvas1.getContext('webgl'),
    canvas2.getContext('webgl')
];

// Getting canvas width and height
scrW = canvas1.width;
scrH = canvas1.height;

// Map of used textures
var shapeTextures = [{}, {}];

// Info needed for setting up WebGL
var programInfo = [{}, {}];

// Transformation matrices
projMatrix = new Float32Array(16);
viewMatrix = new Float32Array(16);
tranMatrix = new Float32Array(16);
normMatrix = new Float32Array(16);

// Definition of perspective projection matrix - it does not change 
mat4.perspective(self.projMatrix, 0.5, scrW / scrH, 1.0, 50.0);

// Definition of only shape we use - square
squareShape = {
    vert: [
        0.5,  0.5,  0.0,    0.0, 0.0,
        -0.5, -0.5, 0.0,    1.0, 1.0,
        0.5,  -0.5, 0.0,    0.0, 1.0,
        -0.5, 0.5,  0.0,    1.0, 0.0
    ],
    ind: [
        0, 1, 2,
        0, 1, 3
    ]
};

// Definition of only object we need - square object
objs = {
    "square" : {
        VBO: [
            gl[0].createBuffer(),
            gl[1].createBuffer()
        ],
        IBO: [
            gl[0].createBuffer(),
            gl[1].createBuffer()
        ]
    }
}

// Allocating memory for the square object on the GPU for both gl contextes
for (var i = 0; i < 2; i++) {
    gl[i].bindBuffer(gl[i].ARRAY_BUFFER, objs["square"].VBO[i]);
    gl[i].bindBuffer(gl[i].ELEMENT_ARRAY_BUFFER, objs["square"].IBO[i]);
    if (i == 0) gl[i].bindTexture(gl[i].TEXTURE_2D, shapeTextures[i]["green"]);
    else gl[i].bindTexture(gl[i].TEXTURE_2D, shapeTextures[i]["red"]);
    gl[i].activeTexture(gl[i].TEXTURE0);
    gl[i].uniform1i(programInfo[i].samplerUnifLoc, 0);
    gl[i].vertexAttribPointer(
        programInfo[i].posAttribLoc, 3, gl[i].FLOAT, gl[i].FALSE, 
        5 * Float32Array.BYTES_PER_ELEMENT, 0
    );
    gl[i].vertexAttribPointer(
        programInfo[i].coordAttribLoc, 2, gl[i].FLOAT, gl[i].FALSE, 
        5 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT
    );

    gl[i].bufferData(gl[i].ARRAY_BUFFER, new Float32Array(squareShape.vert), gl[i].STATIC_DRAW);
    gl[i].bufferData(gl[i].ELEMENT_ARRAY_BUFFER, new Uint16Array(squareShape.ind), gl[i].STATIC_DRAW);
    gl[i].enableVertexAttribArray(programInfo[i].posAttribLoc);
    gl[i].enableVertexAttribArray(programInfo[i].coordAttribLoc);
}

// Defining colors we need
var colorImgs = [
    { name: 'white', color: new Uint8Array([255, 255, 255, 255]) },
    { name: 'green', color: new Uint8Array([0,   255, 0,   255]) },
    { name: 'red',   color: new Uint8Array([255, 0,   0,   255]) }
];

// Some parameters for later use 
var texParams = {
    level: 0,
    internalFormat: gl[0].RGBA,
    width: 1,
    height: 1,
    border: 0,
    srcFormat: gl[0].RGBA,
    srcType: gl[0].UNSIGNED_BYTE,
    pixel: new Uint8Array([0, 0, 255, 255])  // opaque blue
};

// Running all of the configuration for both gl contexes
for (var j = 0; j < 2; j++) {
    // Definig three textures we use, using defined colors
    for (var i in colorImgs) {
        shapeTextures[j][colorImgs[i].name] = gl[j].createTexture();
        gl[j].bindTexture(gl[j].TEXTURE_2D, shapeTextures[j][colorImgs[i].name]);
        gl[j].activeTexture(gl[j].TEXTURE0);
        gl[j].uniform1i(programInfo[j].samplerUnifLoc, 0);
        gl[j].texImage2D(
            gl[j].TEXTURE_2D, 
            texParams.level, 
            texParams.internalFormat,
            texParams.width, 
            texParams.height, 
            texParams.border,
            texParams.srcFormat,
            texParams.srcType, 
            colorImgs[i].color
            );
    }

    // Color of the cleared screen
    gl[j].clearColor(0.0, 0.0, 0.0, 1.0);
    // Typical configuration
    gl[j].enable(gl[j].DEPTH_TEST);
    gl[j].enable(gl[j].BLEND);
    gl[j].blendFuncSeparate(gl[j].SRC_ALPHA, gl[j].ONE_MINUS_SRC_ALPHA, gl[j].ONE, gl[j].ONE_MINUS_SRC_ALPHA);

    // GLSL Shader loading and complilation
    shaders.vertexShader = gl[j].createShader(gl[j].VERTEX_SHADER);
    shaders.fragmentShader = gl[j].createShader(gl[j].FRAGMENT_SHADER);

    gl[j].shaderSource(shaders.vertexShader, shaders.vertexShaderText);
    gl[j].shaderSource(shaders.fragmentShader, shaders.fragmentShaderText);

    // Shader programs are compiled each time the application is loaded
    //   on the computer because it optimizes graphical performance for 
    //   the graphics hardware available
    gl[j].compileShader(shaders.vertexShader);
    if (!gl[j].getShaderParameter(shaders.vertexShader, gl[j].COMPILE_STATUS)) 
        console.log(gl[j].getShaderInfoLog(shaders.vertexShader));
    gl[j].compileShader(shaders.fragmentShader);
    if (!gl[j].getShaderParameter(shaders.fragmentShader, gl[j].COMPILE_STATUS)) 
        console.log(gl[j].getShaderInfoLog(shaders.fragmentShader));

    // Program represents combination of shaders
    var program = gl[j].createProgram();
    gl[j].attachShader(program, shaders.vertexShader);
    gl[j].attachShader(program, shaders.fragmentShader);
    gl[j].linkProgram(program);
    if (!gl[j].getProgramParameter(program, gl[j].LINK_STATUS)) console.log(gl[j].getProgramInfoLog(program));
    gl[j].validateProgram(program);
    if (!gl[j].getProgramParameter(program, gl[j].VALIDATE_STATUS)) console.log(gl[j].getProgramInfoLog(program));

    // use compiled GLSL (GL shader language) program for graphics rendering
    gl[j].useProgram(program);

    // Defining variables containing pointers to the location on GPU where 
    //   shader attributes and uniformes are located
    programInfo[j].matProjUnifLoc = gl[j].getUniformLocation(program, 'projMatrix');
    programInfo[j].matViewUnifLoc = gl[j].getUniformLocation(program, 'viewMatrix');
    programInfo[j].matTranUnifLoc = gl[j].getUniformLocation(program, 'tranMatrix');
    programInfo[j].samplerUnifLoc = gl[j].getUniformLocation(program, 'smpler');
    programInfo[j].posAttribLoc = gl[j].getAttribLocation(program, 'vertPosition');
    programInfo[j].coordAttribLoc = gl[j].getAttribLocation(program, 'textCoord');
}
