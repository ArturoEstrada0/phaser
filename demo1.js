var w = 800
var h = 400
var jugador
var fondo

var bala,
  balaD = false,
  nave

var bala2,
  balaD2 = false,
  nave2
var bala3,
  balaD3 = false,
  nave3

var salto

var estadoArriba, estadoAbajo, estadoIzquierda, estadoDerecha

var moverDerecha
var moverAtras

var menu

var velocidadBala
var despBala

var velocidadBala2
var despBala2

var velocidadBala3x
var velocidadBala3y
var despBala3x
var despBala3y

var estatusAire
var estatuSuelo

var nnNetwork,
  nnEntrenamiento,
  nnSalida,
  datosEntrenamiento = []
var modoAuto = false,
  eCompleto = false

var despDerTiempo
var despAtrTiempo

var estatusDerecha
var estatusIzquierda
var estatusAtras
var estatusInicio

var balas

var jugadorGolpeado
var regresandoDer
var regresandoAtras

var tiempoB3
var tiempoB2

var ticks = 0 // Variable para contar el número de ciclos

// Variables globales de velocidad
var velocidadBalaMin = 100
var velocidadBalaMax = 300
var velocidadBala2Min = 50
var velocidadBala2Max = 100
var velocidadBala3Min = 10
var velocidadBala3Max = 100

var velocidadJugador = 5

var juego = new Phaser.Game(w, h, Phaser.CANVAS, '', {
  preload: preload,
  create: create,
  update: update,
  render: render,
})

function preload() {
  juego.load.image('fondo', 'assets/game/fondo.jpg')
  juego.load.spritesheet('mono', 'assets/sprites/altair.png', 32, 48)
  juego.load.image('nave', 'assets/game/voyager.png')
  juego.load.image('bala', 'assets/sprites/balaMario.png')
  juego.load.image('menu', 'assets/game/menu.png')
}

function create() {
  juego.physics.startSystem(Phaser.Physics.ARCADE)
  juego.physics.arcade.gravity.y = 800
  juego.time.desiredFps = 60

  fondo = juego.add.tileSprite(0, 0, w, h, 'fondo')
  nave = juego.add.sprite(w - 100, h - 70, 'nave')
  bala = juego.add.sprite(w - 100, h, 'bala')
  jugador = juego.add.sprite(50, h, 'mono')

  nave2 = juego.add.sprite(20, 10, 'nave')
  bala2 = juego.add.sprite(60, 70, 'bala')
  nave3 = juego.add.sprite(w - 200, 40, 'nave')
  bala3 = juego.add.sprite(600, 100, 'bala')

  juego.physics.enable(jugador)
  jugador.body.collideWorldBounds = true
  var corre = jugador.animations.add('corre', [8, 9, 10, 11])
  jugador.animations.play('corre', 10, true)

  juego.physics.enable(bala)
  bala.body.collideWorldBounds = true

  juego.physics.enable(bala2)
  bala2.body.collideWorldBounds = true
  juego.physics.enable(bala3)
  bala3.body.collideWorldBounds = true

  pausaL = juego.add.text(w - 100, 20, 'Pausa', {
    font: '20px Arial',
    fill: '#fff',
  })
  pausaL.inputEnabled = true
  pausaL.events.onInputUp.add(pausa, self)
  juego.input.onDown.add(mPausa, self)

  salto = juego.input.keyboard.addKeys({
    space: Phaser.Keyboard.SPACEBAR,
    up: Phaser.Keyboard.UP,
  })
  moverDerecha = juego.input.keyboard.addKey(Phaser.Keyboard.RIGHT)
  moverAtras = juego.input.keyboard.addKey(Phaser.Keyboard.LEFT)

  nnNetwork = new synaptic.Architect.Perceptron(9, 18, 3) // Incrementar el número de entradas
  nnEntrenamiento = new synaptic.Trainer(nnNetwork)

  estatusDerecha = 0
  estatusIzquierda = 1
  estatusInicio = 1
  estatusAtras = 0

  despDerTiempo = 0
  despAtrTiempo = 0

  balas = juego.add.group()
  balas.add(bala)
  balas.add(bala2)
  balas.add(bala3)

  jugadorGolpeado = false
  regresandoDer = false
  regresandoAtras = false

  tiempoB3 = 0
  tiempoB2 = 0
}

function enRedNeural() {
  if (datosEntrenamiento.length > 0) {
    nnEntrenamiento.train(datosEntrenamiento, {
      rate: 0.0001,
      iterations: 20000,
      shuffle: true,
    })
  }
}

function datosDeEntrenamiento(param_entrada) {
  nnSalida = nnNetwork.activate(param_entrada)
  return nnSalida
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
        eCompleto = false
        datosEntrenamiento = []
        modoAuto = false
      } else if (
        mouse_x >= menu_x1 &&
        mouse_x <= menu_x2 &&
        mouse_y >= menu_y1 + 90 &&
        mouse_y <= menu_y2
      ) {
        if (!eCompleto) {
          console.log(
            '',
            'movimientos ' + datosEntrenamiento.length + ' valores',
          )
          enRedNeural()
          eCompleto = true
        }
        modoAuto = true
      }

      menu.destroy()
      resetVariables()
      balas.forEach(function (bala) {
        bala.body.checkCollision.none = false
      })
      juego.paused = false
      jugadorGolpeado = false

      balaD2 = false
      balaD3 = false
    }
  }
}

function resetVariables() {
  jugador.body.velocity.x = 0
  jugador.body.velocity.y = 0
  bala.body.velocity.x = 0
  bala.position.x = w - 100
  jugador.position.x = 50
  balaD = false

  bala2.body.velocity.y = 0
  bala2.position.y = 70
  balaD2 = false
  bala3.body.velocity.y = 0
  bala3.body.velocity.x = 0
  bala3.position.x = 600
  bala3.position.y = 100
  balaD3 = false
  estatusDerecha = 0
  estatusIzquierda = 1
  despDerTiempo = 0
  jugadorGolpeado = false
  regresandoDer = false

  estatusInicio = 1
  estatusAtras = 0
  despAtrTiempo = 0
  regresandoAtras = false

  tiempoB3 = 0
  tiempoB2 = 0
}

function saltar() {
  jugador.body.velocity.y = -270
}

function moverseDer() {
  estatusIzquierda = 0
  estatusDerecha = 1
  estatusAtras = 0
  estatusInicio = 1

  despAtrTiempo = 0
  despDerTiempo = 0

  regresandoAtras = false
  regresandoDer = false
}

function moverseAtr() {
  estatusIzquierda = 1
  estatusDerecha = 0

  estatusAtras = 1
  estatusInicio = 0

  despAtrTiempo = 0
  despDerTiempo = 0

  regresandoAtras = false
  regresandoDer = false
}

function update() {
  fondo.tilePosition.x -= 1

  juego.physics.arcade.collide(balas, jugador, colisionH, null, this)

  estatuSuelo = 1
  estatusAire = 0

  if (!jugador.body.onFloor()) {
    estatuSuelo = 0
    estatusAire = 1
  }

  despBala = Math.floor(jugador.position.x - bala.position.x)
  despBala2 = Math.floor(jugador.position.y - bala2.position.y)
  despBala3x = Math.floor(jugador.position.x - bala3.position.x)
  despBala3y = Math.floor(jugador.position.y - bala3.position.y)

  // Captura el estado de las teclas
  estadoArriba = salto.up.isDown ? 1 : 0
  estadoAbajo = juego.input.keyboard.isDown(Phaser.Keyboard.DOWN) ? 1 : 0
  estadoIzquierda = moverAtras.isDown ? 1 : 0
  estadoDerecha = moverDerecha.isDown ? 1 : 0

  if (modoAuto == false && estadoDerecha && estatusDerecha == 0) {
    moverseDer()
  }

  if (estatusDerecha == 1) {
    jugador.position.x += velocidadJugador
    if (jugador.position.x >= 90) {
      jugador.position.x = 90
      estatusDerecha = 0
      estatusIzquierda = 1
    }
  }

  if (estatusAtras == 1) {
    jugador.position.x -= velocidadJugador
    if (jugador.position.x <= 0) {
      jugador.position.x = 0
      estatusAtras = 0
      estatusInicio = 1
    }
  }

  if (modoAuto == false && estadoIzquierda && estatusAtras == 0) {
    moverseAtr()
  }

  if (modoAuto == true) {
    // Resetear el estado de movimiento
    estatusDerecha = 0
    estatusIzquierda = 0
    estatusAtras = 0

    if (datosEntrenamiento.length > 0) {
      let output = datosDeEntrenamiento([
        despBala,
        velocidadBala,
        despBala2,
        despBala3x,
        despBala3y,
        jugador.position.x, // Posición X del jugador
        jugador.position.y, // Posición Y del jugador
        estatuSuelo, // Estado del jugador en el suelo
        estatusAire, // Estado del jugador en el aire
      ])

      if (output[1] > 0.5) {
        moverseDer()
      } else if (output[2] > 0.5) {
        moverseAtr()
      }

      if (output[0] > 0.5 && jugador.body.onFloor()) {
        saltar()
      }
    }
  }

  if (
    modoAuto == false &&
    (estadoArriba || salto.space.isDown) &&
    jugador.body.onFloor()
  ) {
    saltar()
  }

  if (balaD == false) {
    disparo()
  }
  if (balaD2 == false && tiempoB2 >= 20) {
    disparo2()
  }
  if (balaD3 == false && tiempoB3 >= 45) {
    disparo3()
  }

  if (balaD3 == false) {
    bala3.position.x = 780
    bala3.position.y = 380
    bala3.body.velocity.y = 0
    bala3.body.velocity.x = 0
    bala3.visible = true
    tiempoB3++
  }

  if (balaD2 == false) {
    bala2.body.velocity.y = 0
    bala2.body.velocity.x = 0
    bala2.position.x = 780
    bala2.position.y = 380
    bala2.visible = true
    tiempoB2++
  }

  if (bala.position.x <= 0) {
    bala.body.velocity.x = 0
    bala.position.x = w - 100
    balaD = false
  }

  if (bala2.position.y >= 350 && bala2.position.x <= 70 && balaD2 == true) {
    bala2.position.x = 750
    bala2.position.y = 350
    bala2.body.velocity.y = 0
    bala2.body.velocity.x = 0
    balaD2 = false
    tiempoB2 = 0
    bala2.visible = true
  }

  if (bala3.position.y >= 380 && bala3.position.x <= 0 && balaD3 == true) {
    bala3.body.velocity.y = 0
    bala3.body.velocity.x = 0
    bala3.position.x = 600
    bala3.position.y = 100
    balaD3 = false
    tiempoB3 = 0
    bala3.visible = true
  }

  if (modoAuto == false && bala.position.x > 0) {
    // Registrar datos en intervalos más frecuentes
    if (ticks % 5 === 0 && (estadoDerecha || estadoIzquierda || estadoArriba)) {
      // Cada 5 ciclos
      datosEntrenamiento.push({
        input: [
          despBala,
          velocidadBala,
          despBala2,
          despBala3x,
          despBala3y,
          jugador.position.x, // Posición X del jugador
          jugador.position.y, // Posición Y del jugador
          estatuSuelo, // Estado del jugador en el suelo
          estatusAire, // Estado del jugador en el aire
        ],
        output: [
          estadoArriba, // Salto
          estadoDerecha, // Movimiento derecha
          estadoIzquierda, // Movimiento izquierda
        ],
      })
      console.log(
        'Datos de entrenamiento: ',
        despBala,
        velocidadBala,
        despBala2,
        despBala3x,
        despBala3y,
        jugador.position.x,
        jugador.position.y,
        estatuSuelo,
        estatusAire,
      )
    }
    ticks++
  }
}

function disparo() {
  velocidadBala = -1 * velocidadRandom(velocidadBalaMin, velocidadBalaMax) // Velocidad más lenta
  bala.body.velocity.y = 0
  bala.body.velocity.x = velocidadBala
  balaD = true
}

function disparo2() {
  velocidadBala2 = 1 * velocidadRandom(velocidadBala2Min, velocidadBala2Max) // Velocidad más lenta
  bala2.position.x = 60
  bala2.position.y = 70
  bala2.body.velocity.x = 0
  bala2.body.velocity.y = velocidadBala2
  balaD2 = true
  bala2.visible = true
}

function disparo3() {
  var targetX = 60
  var targetY = h
  var dx = targetX - bala3.x
  var dy = targetY - bala3.y
  var angle = Math.atan2(dy, dx)
  bala3.visible = true
  velocidadBala3y = 1 * velocidadRandom(velocidadBala3Min, velocidadBala3Max) // Velocidad más lenta
  velocidadBala3x = -320 // Menor velocidad horizontal
  bala3.position.x = 600
  bala3.position.y = 100
  bala3.body.velocity.x = velocidadBala3x
  bala3.body.velocity.y = Math.sin(angle) * velocidadBala3y
  balaD3 = true
}

function colisionH() {
  if (!jugadorGolpeado) {
    balas.forEach(function (bala) {
      bala.body.checkCollision.none = true
    })
    pausa()
    jugadorGolpeado = true
  }
}

function velocidadRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function render() {}
