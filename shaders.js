var shaders = {
    // Program running on the GPU, maping object vertices
    //   from local coordinate system to the screen 
    // Runs for each vertex inside the object in parallel 
    vertexShaderText: [
        'precision mediump float;',
        '',
        'attribute vec3 vertPosition;',
        'attribute vec2 textCoord;',
        '',
        'uniform mat4 projMatrix;',
        'uniform mat4 viewMatrix;',
        'uniform mat4 tranMatrix;',
        '',
        'varying highp vec2 textureCoord;',
        '',
        'void main()',
        '{',
        '    gl_Position = projMatrix * viewMatrix * tranMatrix * vec4(vertPosition, 1.0);',
        '    textureCoord = textCoord;',
        '}'
    ].join('\n'),
    // Program running on the GPU, determining the color of
    //   every pixel on the screen - reading it from the texture
    fragmentShaderText: [
        'precision mediump float;',
        '',
        'varying highp vec2 textureCoord;',
        '',
        'uniform sampler2D sampler;',
        '',
        'void main()',
        '{',
        '    gl_FragColor = texture2D(sampler, textureCoord);',
        '}'
    ].join('\n')
};
