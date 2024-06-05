var w = 800
var h = 400
var jugador
var fondo

var bala,
  balaD = false,
  nave,
  nave2,
  nave3,
  bala2,
  bala3

var salto
var menu

var velocidadBala
var despBala
var estatusAire
var estatuSuelo

var nnNetwork,
  nnEntrenamiento,
  nnSalida,
  datosEntrenamiento = []
var modoAuto = false,
  eCompleto = false

var juego = new Phaser.Game(w, h, Phaser.CANVAS, '', {
  preload: preload,
  create: create,
  update: update,
  render: render,
})

function preload() {
  juego.load.image('fondo', 'assets/game/fondo.jpg')
  juego.load.spritesheet('mono', 'assets/sprites/altair.png', 32, 48)
  juego.load.image('nave', 'assets/game/ufo.png')
  juego.load.image('bala', 'assets/sprites/purple_ball.png')
  juego.load.image('menu', 'assets/game/menu.png')
}

function create() {
  iniciarJuego()
  pausaL = juego.add.text(w - 100, 20, 'Pausa', {
    font: '20px Arial',
    fill: '#fff',
  })
  pausaL.inputEnabled = true
  pausaL.events.onInputUp.add(pausa, self)
  juego.input.onDown.add(mPausa, self)

  // Configuración de teclas de movimiento
  cursores = juego.input.keyboard.createCursorKeys()
  salto = juego.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)

  nnNetwork = new synaptic.Architect.Perceptron(5, 6, 6, 3)
  nnEntrenamiento = new synaptic.Trainer(nnNetwork)
}

function iniciarJuego() {
  juego.physics.startSystem(Phaser.Physics.ARCADE)
  juego.physics.arcade.gravity.y = 800
  juego.time.desiredFps = 30

  fondo = juego.add.tileSprite(0, 0, w, h, 'fondo')

  nave = juego.add.sprite(w - 100, h - 70, 'nave')
  nave2 = juego.add.sprite(0, 0, 'nave') // Nave en la esquina superior izquierda
  nave3 = juego.add.sprite(w - 100, 0, 'nave') // Nave en la esquina superior derecha

  bala = juego.add.sprite(w - 100, h, 'bala')
  bala2 = juego.add.sprite(nave2.x, nave2.y, 'bala')
  bala3 = juego.add.sprite(nave3.x, nave3.y, 'bala')

  jugador = juego.add.sprite(50, h - 70, 'mono')

  juego.physics.enable(jugador)
  jugador.body.collideWorldBounds = true
  var corre = jugador.animations.add('corre', [8, 9, 10, 11])
  jugador.animations.play('corre', 10, true)

  juego.physics.enable(bala)
  juego.physics.enable(bala2)
  juego.physics.enable(bala3)

  bala.body.collideWorldBounds = true
  bala2.body.collideWorldBounds = true
  bala3.body.collideWorldBounds = true
}

function enRedNeural() {
  nnEntrenamiento.train(datosEntrenamiento, {
    rate: 0.03,
    iterations: 10000,
    shuffle: true,
  })
}

function datosDeEntrenamiento(param_entrada) {
  nnSalida = nnNetwork.activate(param_entrada)
  var moverIzquierda = nnSalida[0] > 0.5
  var moverDerecha = nnSalida[1] > 0.5
  var saltar = nnSalida[2] > 0.5
  return {
    moverIzquierda: moverIzquierda,
    moverDerecha: moverDerecha,
    saltar: saltar,
  }
}

function pausa() {
  juego.paused = true
  menu = juego.add.sprite(w / 2, h / 2, 'menu')
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
        // Modo Manual
        modoAuto = false
        datosEntrenamiento = []
        eCompleto = false
        resetJuego()
      } else if (
        mouse_x >= menu_x1 &&
        mouse_x <= menu_x2 &&
        mouse_y >= menu_y1 + 90 &&
        mouse_y <= menu_y2
      ) {
        // Modo Automático
        if (!eCompleto) {
          enRedNeural()
          eCompleto = true
        }
        modoAuto = true
      }

      menu.destroy()
      juego.paused = false
    }
  }
}

function resetJuego() {
  juego.world.removeAll()
  iniciarJuego()
}

function resetBala(bala, x, y) {
  bala.body.velocity.x = 0
  bala.body.velocity.y = 0
  bala.position.x = x
  bala.position.y = y
}

function resetBalas() {
  resetBala(bala, w - 100, h - 70)
  resetBala(bala2, nave2.x, nave2.y)
  resetBala(bala3, nave3.x, nave3.y)
  balaD = false
}

function saltar() {
  jugador.body.velocity.y = -270
}

function update() {
  fondo.tilePosition.x -= 1

  juego.physics.arcade.collide(bala, jugador, colisionH, null, this)
  juego.physics.arcade.collide(bala2, jugador, colisionH, null, this)
  juego.physics.arcade.collide(bala3, jugador, colisionH, null, this)

  estatuSuelo = 1
  estatusAire = 0

  if (!jugador.body.onFloor()) {
    estatuSuelo = 0
    estatusAire = 1
  }

  despBala = Math.floor(jugador.position.x - bala.position.x)

  // Movimiento del jugador en modo manual y registro de datos de entrenamiento
  if (modoAuto == false) {
    if (cursores.left.isDown) {
      jugador.body.velocity.x = -150
    } else if (cursores.right.isDown) {
      jugador.body.velocity.x = 150
    } else {
      jugador.body.velocity.x = 0
    }

    if (salto.isDown && jugador.body.onFloor()) {
      saltar()
    }

    datosEntrenamiento.push({
      input: [
        bala.position.x - jugador.position.x,
        bala2.position.x - jugador.position.x,
        bala2.position.y - jugador.position.y,
        bala3.position.x - jugador.position.x,
        bala3.position.y - jugador.position.y,
      ],
      output: [
        cursores.left.isDown ? 1 : 0,
        cursores.right.isDown ? 1 : 0,
        salto.isDown ? 1 : 0,
      ],
    })

    // Movimiento del jugador en modo automático
  } else {
    var salida = datosDeEntrenamiento([
      bala.position.x - jugador.position.x,
      bala2.position.x - jugador.position.x,
      bala2.position.y - jugador.position.y,
      bala3.position.x - jugador.position.x,
      bala3.position.y - jugador.position.y,
    ])

    if (salida.moverIzquierda) {
      jugador.body.velocity.x = -150
    } else if (salida.moverDerecha) {
      jugador.body.velocity.x = 150
    } else {
      jugador.body.velocity.x = 0
    }

    if (salida.saltar && jugador.body.onFloor()) {
      saltar()
    }
  }

  if (balaD == false) {
    disparo()
  }

  if (bala.position.x <= 0 || bala2.position.y >= h || bala3.position.x <= 0) {
    resetBalas()
  }
}

function disparo() {
  velocidadBala = -1 * velocidadRandom(300, 800)
  bala.body.velocity.y = 0
  bala.body.velocity.x = velocidadBala

  // Configurar balas adicionales
  bala2.position.x = jugador.x // Coloca la bala justo encima del jugador
  bala2.body.velocity.y = 300 // Deja caer la bala sobre el jugador

  var velocidadBala3 = calcularVelocidadBala(nave3, jugador)
  bala3.body.velocity.x = velocidadBala3.vx
  bala3.body.velocity.y = velocidadBala3.vy

  balaD = true
}

function calcularVelocidadBala(nave, jugador) {
  var dx = jugador.x - nave.x
  var dy = jugador.y - nave.y
  var angulo = Math.atan2(dy, dx)
  var velocidad = 400 // Ajusta la velocidad según sea necesario
  return {
    vx: Math.cos(angulo) * velocidad,
    vy: Math.sin(angulo) * velocidad,
  }
}

function colisionH() {
  pausa()
}

function velocidadRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function render() {}
