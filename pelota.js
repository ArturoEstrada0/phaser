var w = 500,
  h = 450
var jugador, fondo, bala
var gameOverSound // Variable para almacenar el sonido
var verticalVol = false,
  verticalHor = false
var cursors, menu
var statusIzq, statusDer, statusTOP, statusBOT, statusMove
var nnNetwork,
  nnEntrenamiento,
  nnSalida,
  datosEntrenamiento = []
var modoAuto = false,
  eCompleto = false
var jugadorenX = 200,
  jugadorenY = 200
var autoMode = false
var juego = new Phaser.Game(w, h, Phaser.CANVAS, '', {
  preload: preload,
  create: create,
  update: update,
  render: render,
})

var score = 0
var scoreText
var lives = 3
var livesText
var gameOverText
var autoModeButton
var trainingGames = 3 // Número de juegos de entrenamiento
var currentGame = 0 // Juego actual
var trainingData = [] // Datos de entrenamiento acumulados
var trainingComplete = false

function preload() {
  juego.load.image('fondo', 'assets/game/fondo.jpg')
  juego.load.spritesheet('mono', 'assets/sprites/altair.png', 32, 48)
  juego.load.image('menu', 'assets/game/menu.png')
  juego.load.image('bala', 'assets/sprites/dragon.png')
  juego.load.audio('gameOverSound', 'assets/audio/game_over.wav') // Cargar el archivo de audio
}

function create() {
  juego.physics.startSystem(Phaser.Physics.ARCADE)
  juego.physics.arcade.gravity.y = 0
  juego.time.desiredFps = 30

  fondo = juego.add.tileSprite(0, 0, w, h, 'fondo')
  jugador = juego.add.sprite(w / 2, h / 2, 'mono')
  juego.physics.enable(jugador)
  jugador.body.collideWorldBounds = true // Evitar que el jugador salga de los limites del mundo

  var corre = jugador.animations.add('corre', [8, 9, 10, 11])
  jugador.animations.play('corre', 10, true)

  // Añadir la bala en la esquina superior derecha
  bala = juego.add.sprite(0, 0, 'bala')
  juego.physics.enable(bala)
  bala.body.collideWorldBounds = true
  bala.body.bounce.set(1) // Hacer que la bala rebote
  setRandomBalaVelocity() // Establecer una velocidad inicial aleatoria para la bala

  pausaL = juego.add.text(w - 100, 20, 'Pausa', {
    font: '20px Arial',
    fill: '#fff',
  })
  pausaL.inputEnabled = true
  pausaL.events.onInputUp.add(pausa, self)
  juego.input.onDown.add(mPausa, self)

  // Creación de teclas de dirección
  cursors = juego.input.keyboard.createCursorKeys()

  nnNetwork = new synaptic.Architect.Perceptron(5, 6, 6, 6, 5)
  nnEntrenamiento = new synaptic.Trainer(nnNetwork)

  gameOverSound = juego.add.audio('gameOverSound') // Añadir el audio al juego

  scoreText = juego.add.text(16, 16, 'Puntuacion: 0', {
    font: '32px Arial',
    fill: '#fff',
  })

  livesText = juego.add.text(16, 50, 'Vidas: 3', {
    font: '32px Arial',
    fill: '#fff',
  })

  gameOverText = juego.add.text(w / 2, h / 2, 'Fin del juego', {
    font: '64px Arial',
    fill: '#fff',
  })
  gameOverText.anchor.setTo(0.5)
  gameOverText.visible = false // Ocultar el texto inicialmente

  autoModeButton = juego.add.text(w / 2, h / 2 + 100, 'Enter Auto Mode', {
    font: '32px Arial',
    fill: '#fff',
  })
  autoModeButton.anchor.setTo(0.5)
  autoModeButton.inputEnabled = true
  autoModeButton.visible = false
  autoModeButton.events.onInputUp.add(enterAutoMode, self)
}

function redNeuronal() {
  nnEntrenamiento.train(datosEntrenamiento, {
    rate: 0.0003,
    iterations: 10000,
    shuffle: true,
  })
}

function vertical(param_entrada) {
  console.log('---------------DATOS-------------------')
  console.log(
    'Datos de Entrada en Vertical:' +
      '\n Izquierdo:' +
      param_entrada[0] +
      '\n Derecha:' +
      param_entrada[1] +
      '\n Arriba:' +
      param_entrada[2] +
      '\n Abajo:' +
      param_entrada[3],
  )

  nnSalida = nnNetwork.activate(param_entrada)
  var Topv = Math.round(nnSalida[2] * 100)

  if (param_entrada[2] < 80) {
    if (Topv > 35 && Topv < 65) {
      return false
    }
  }

  return nnSalida[2] >= nnSalida[3]
}

function horizontal(param_entrada) {
  console.log('---------------DATOS-------------------')
  console.log(
    'Datos del metodo Horizontal:' +
      '\n Izquierdo:' +
      param_entrada[0] +
      '\n Derecha:' +
      param_entrada[1] +
      '\n Arriba:' +
      param_entrada[2] +
      '\n Abajo:' +
      param_entrada[3],
  )

  nnSalida = nnNetwork.activate(param_entrada)
  var Derecha = Math.round(nnSalida[1] * 100)

  if (param_entrada[2] < 80) {
    if (Derecha > 40 && Derecha < 55) {
      return false
    }
  }

  return nnSalida[0] >= nnSalida[1]
}

function movimiento(param_entrada) {
  console.log('---------------DATOS-------------------')
  console.log(
    'Datos de Movimientos:' +
      '\n Izquierdo:' +
      param_entrada[0] +
      '\n Derecha:' +
      param_entrada[1] +
      '\n Arriba:' +
      param_entrada[2] +
      '\n Abajo:' +
      param_entrada[3],
  )
  nnSalida = nnNetwork.activate(param_entrada)

  return nnSalida[4] * 100 >= 20
}

function pausa() {
  juego.paused = true // Pausar el juego
  menu = juego.add.sprite(w / 2, h / 2, 'menu') // Añadir menú de pausa
  menu.anchor.setTo(0.5, 0.5)
}

function mPausa(event) {
  if (juego.paused) {
    var menu_x1 = w / 2 - 270 / 2,
      menu_x2 = w / 2 + 270 / 2,
      menu_y1 = h / 2 - 180 / 2,
      menu_y2 = h / 2 + 180 / 2

    var mouse_x = event.x,
      mouse_y = event.y

    if (
      mouse_x > menu_x1 &&
      mouse_x < menu_x2 &&
      mouse_y > menu_y1 &&
      mouse_y < menu_y2
    ) {
      if (
        mouse_x >= menu_x1 &&
        mouse_x <= menu_x2 &&
        mouse_y >= menu_y1 &&
        mouse_y <= menu_y1 + 90
      ) {
        eCompleto = false
        datosEntrenamiento = []
        modoAuto = false // Modo manual
        autoMode = false
      } else if (
        mouse_x >= menu_x1 &&
        mouse_x <= menu_x2 &&
        mouse_y >= menu_y1 + 90 &&
        mouse_y <= menu_y2
      ) {
        if (!eCompleto) {
          console.log(
            '',
            'Entrenamiento ' + datosEntrenamiento.length + ' valores',
          )
          redNeuronal()
          eCompleto = true
        }
        modoAuto = true // Modo automático
        autoMode = true
      }
      menu.destroy()
      resetGame() // Resetear el juego
      juego.paused = false
    }
  }
}

function resetGame() {
  // Resetear la posición y velocidad del jugador
  jugador.x = w / 2
  jugador.y = h / 2
  jugador.body.velocity.x = 0
  jugador.body.velocity.y = 0

  // Resetear la posición y velocidad de la bala
  bala.x = 0
  bala.y = 0
  setRandomBalaVelocity() // Establecer una velocidad inicial aleatoria para la bala

  if (currentGame >= trainingGames) {
    autoMode = true // Activar modo automático después del entrenamiento
  }
}

function setRandomBalaVelocity() {
  var baseSpeed = 550
  var speed = baseSpeed + score / 10 // Incrementar la velocidad con la puntuación
  var angle = juego.rnd.angle() // Obtener un ángulo aleatorio
  bala.body.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed)
}

function update() {
  fondo.tilePosition.x -= 1 // Mover el fondo para crear efecto de desplazamiento

  // Ajuste la velocidad de la pelota en cada rebote
  juego.physics.arcade.collide(bala, null, adjustBallVelocity, null, this)

  if (!autoMode) {
    // Resetear velocidad del jugador
    jugador.body.velocity.x = 0
    jugador.body.velocity.y = 0

    // Movimiento del jugador con teclas de dirección
    if (cursors.left.isDown) {
      jugador.body.velocity.x = -300 // Mover a la izquierda
    } else if (cursors.right.isDown) {
      jugador.body.velocity.x = 300 // Mover a la derecha
    }

    if (cursors.up.isDown) {
      jugador.body.velocity.y = -300 // Mover hacia arriba
    } else if (cursors.down.isDown) {
      jugador.body.velocity.y = 300 // Mover hacia abajo
    }
  }

  // Colisionar la bala con el jugador
  juego.physics.arcade.collide(bala, jugador, colisionH, null, this)

  // Calcular la distancia entre la bala y el jugador
  var dx = bala.x - jugador.x
  var dy = bala.y - jugador.y
  var distancia = Math.sqrt(dx * dx + dy * dy) // Fórmula de distancia euclidiana, verifica las coordenadas x,y

  statusIzq = 0
  statusDer = 0
  statusTOP = 0
  statusBOT = 0
  statusMove = 0

  if (!autoMode) {
    // Si la bala está a la derecha, moverse a la izquierda, y viceversa
    if (dx > 0) {
      statusIzq = 1
      statusMove = 1
    } else {
      statusDer = 1 // Mover a la derecha
    }

    // Si la bala está abajo, moverse hacia arriba, y viceversa
    if (dy > 0) {
      statusTOP = 1 // Mover hacia arriba
    } else {
      statusBOT = 1 // Mover hacia abajo
    }

    if (jugador.body.velocity.x != 0 || jugador.body.velocity.y != 0) {
      statusMove = 1
    } else {
      statusMove = 0
    }
  }

  if (currentGame < trainingGames) {
    var input = [dx, dy, distancia, jugador.x, jugador.y]
    var output = [statusIzq, statusDer, statusTOP, statusBOT, statusMove]
    trainingData.push({ input: input, output: output })
  }

  if (autoMode && movimiento([dx, dy, distancia, jugador.x, jugador.y])) {
    if (distancia <= 150) {
      console.log(
        'RETURN DEL METODO VERTICAL: ' +
          vertical([dx, dy, distancia, jugador.x, jugador.y]) +
          '\nRETURN DEL METODO HORIZONTAL: ' +
          horizontal([dx, dy, distancia, jugador.x, jugador.y]),
      )

      if (vertical([dx, dy, distancia, jugador.x, jugador.y]) && !verticalVol) {
        // Mover hacia arriba si vertical es true
        jugador.body.velocity.y -= 35
      } else if (
        !vertical([dx, dy, distancia, jugador.x, jugador.y]) &&
        !verticalVol &&
        distancia <= 95
      ) {
        // Mover hacia abajo si vertical es false
        jugador.body.velocity.y += 35
      }

      if (
        horizontal([dx, dy, distancia, jugador.x, jugador.y]) &&
        !verticalHor
      ) {
        // Mover hacia arriba si horizontal es true
        jugador.body.velocity.x -= 35
      } else if (
        !horizontal([dx, dy, distancia, jugador.x, jugador.y]) &&
        !verticalHor &&
        distancia <= 95
      ) {
        // Mover hacia abajo si horizontal es false
        jugador.body.velocity.x += 35
      }

      // Ajustar la velocidad para que vuelva lentamente al centro si no está en movimiento
      if (jugador.x > 300) {
        jugador.body.velocity.x = -350 // Mover lentamente hacia arriba
        verticalHor = true
      } else if (jugador.x < 100) {
        jugador.body.velocity.x = 350 // Mover lentamente hacia abajo
        verticalHor = true
      } else if (verticalHor && jugador.x > 150 && jugador.x < 250) {
        jugador.body.velocity.x = 0
        verticalHor = false
      } else if (
        horizontal([dx, dy, distancia, jugador.x, jugador.y]) &&
        jugador.body.velocity.x != 0
      ) {
        verticalHor = false
        verticalVol = false
      }

      // Ajustar la velocidad para que vuelva lentamente al centro si no está en movimiento
      if (jugador.y > 300) {
        jugador.body.velocity.y = -350 // Mover lentamente hacia arriba
        verticalVol = true
      } else if (jugador.y < 100) {
        jugador.body.velocity.y = 350 // Mover lentamente hacia abajo
        verticalVol = true
      } else if (verticalVol && jugador.y > 150 && jugador.y < 250) {
        jugador.body.velocity.y = 0
        verticalVol = false
      } else if (
        vertical([dx, dy, distancia, jugador.x, jugador.y]) &&
        jugador.body.velocity.y != 0
      ) {
        verticalHor = false
        verticalVol = false
        verticalHor = false
        verticalVol = false
      }
    } else if (distancia >= 200) {
      jugador.body.velocity.y = 0
      jugador.body.velocity.x = 0
    }
  }

  if (!autoMode && bala.position.x > 0) {
    jugadorenX = jugador.x
    jugadorenY = jugador.y

    datosEntrenamiento.push({
      input: [dx, dy, distancia, jugadorenX, jugadorenY],
      output: [statusIzq, statusDer, statusTOP, statusBOT, statusMove],
    })

    console.log(
      '-------------- DATOS RECIBIDOS --------------\n' +
        'Distancia en el eje X: ' +
        dx +
        '\n' +
        'Distancia en el eje Y: ' +
        dy +
        '\n' +
        'Distancia: ' +
        distancia +
        '\n' +
        'Distancia del jugador en X: ' +
        jugador.x +
        '\n' +
        'Distancia del jugador en Y: ' +
        jugador.y +
        '\n' +
        'Bala en el eje X: ' +
        bala.x +
        '\n' +
        'Bala en el eje Y: ' +
        bala.y +
        '\n\n',
    )

    console.log(
      '-------------- DATOS DE MOVIMIENTO --------------\n' +
        'Movimiento en Izquierda: ' +
        statusIzq +
        '\n' +
        'Movimiento en Derecha: ' +
        statusDer +
        '\n' +
        'Movimiento hacia Arriba: ' +
        statusTOP +
        '\n' +
        'Movimiento hacia Abajo: ' +
        statusBOT +
        '\n',
    )
  }

  // Incrementar la puntuación
  if (!juego.paused && !autoMode) {
    score += 1
    scoreText.text = 'Puntuacion: ' + score
  }
}

function adjustBallVelocity(bala) {
  var angle = juego.rnd.angle() // Obtener un ángulo aleatorio
  var speed = bala.body.velocity.getMagnitude() // Obtener la magnitud actual de la velocidad
  bala.body.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed)
}

function colisionH() {
  gameOverSound.play()
  lives -= 1
  livesText.text = 'Vidas: ' + lives

  if (lives <= 0) {
    currentGame++
    if (currentGame < trainingGames) {
      lives = 3 // Reiniciar vidas para el próximo juego de entrenamiento
      resetGame() // Reiniciar el juego
    } else {
      if (!trainingComplete) {
        nnEntrenamiento.train(trainingData, {
          rate: 0.0003,
          iterations: 10000,
          shuffle: true,
        })
        trainingComplete = true
      }
      gameOverText.visible = true
      autoModeButton.visible = true
      juego.paused = true // Pausar el juego cuando se acaben las vidas
    }
  } else {
    resetGame() // Reiniciar el juego si todavía quedan vidas
  }
}

function enterAutoMode() {
  autoMode = true
  autoModeButton.visible = false
  gameOverText.visible = false
  resetGame()
  juego.paused = false
}

function render() {
  // Opcionalmente, renderizar el estado del juego o información adicional
}
