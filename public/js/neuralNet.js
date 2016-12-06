var synaptic = require('synaptic')
var mapping = require('../../mapping.js')

var trainingSet = require('../../training.js')
var testSet = require('../../testSet.js')

const Layer = synaptic.Layer
const Network = synaptic.Network
const Trainer = synaptic.Trainer

const inputLayer = new Layer(11)
const hiddenLayer = new Layer(20)
const outputLayer = new Layer(5)

inputLayer.project(hiddenLayer)
hiddenLayer.project(outputLayer)

const myNetwork = new Network({
  input: inputLayer,
  hidden: [hiddenLayer],
  output: outputLayer
})

// <<<<<<< HEAD
// var trainingSet = [
//   {
//     input: [0, 0, 1, 0, 0, 1, 0, 1],
//     output: [0, 0, 0, 1, 0, 1]
//   },
//   {
//     input: [0, 1, 0, 0, 0, 1, 0, 0],
//     output: [0, 0, 1, 1, 0, 0]
//   },
//   {
//     input: [1, 0, 0, 0, 1, 0, 0, 0],
//     output: [0, 0, 1, 1, 1, 0]
//   },
//   {
//     input: [0, 0, 1, 0, 0, 1, 0, 1],
//     output: [0, 0, 1, 0, 0, 0]
//   },
//   {
//     input: [0, 0, 0, 1, 0, 1, 0, 0],
//     output: [0, 0, 1, 0, 1, 0, 1]
//   },
//   {
//     input: [1, 0, 1, 0, 0, 0, 1, 1],
//     output: [0, 0, 0, 0, 0, 1]
//   },
//   {
//     input: [0, 0, 1, 0, 0, 1, 0, 1],
//     output: [0, 0, 1, 1, 0, 0]
//   }
// ]
var trainingSet = require('../../training.json')
// var trainingSet = [
//   {
//     input: [0, 0, 1, 0, 0, 1, 0, 1],
//     output: [0, 0, 0, 1, 0, 1]
//   },
//   {
//     input: [0, 1, 0, 0, 0, 1, 0, 0],
//     output: [0, 0, 1, 1, 0, 0]
//   },
//   {
//     input: [1, 0, 0, 0, 1, 0, 0, 0],
//     output: [0, 0, 1, 1, 1, 0]
//   },
//   {
//     input: [0, 0, 1, 0, 0, 1, 0, 1],
//     output: [0, 0, 1, 0, 0, 0]
//   },
//   {
//     input: [0, 0, 0, 1, 0, 1, 0, 0],
//     output: [0, 0, 1, 0, 1, 0, 1]
//   },
//   {
//     input: [1, 0, 1, 0, 0, 0, 1, 1],
//     output: [0, 0, 0, 0, 0, 1]
//   },
//   {
//     input: [0, 0, 1, 0, 0, 1, 0, 1],
//     output: [0, 0, 1, 1, 0, 0]
//   }
// ]

const trainer = new Trainer(myNetwork)
trainer.train(trainingSet, {
  rate: 0.2,
  iterations: 200,
  error: 0.1,
  shuffle: true,
  log: 1,
  cost: Trainer.cost.CROSS_ENTROPY
})

console.log('Done training')

const testNetwork = () => {
  const output = myNetwork.activate([0, 1, 0, 0, 1, 0, 0, 1])
  let num = 0
  let p = 0.6
  for (var i = 0; i < output.length; i++) {
    console.log('Output', output[i].toFixed(2))
    if (output[i].toFixed(2) > 0.8) {
      p = output[i].toFixed(2)
      num = num + Math.pow(2, (output.length - i - 1))
    }
  }
  console.log('Number is ', num)
}

const getVacantSeats = (date, flight) => {
  date = '' + date
  const formattedDate = date.split('T')
  const reqDate = formattedDate[0]
  let reqInputs = []
  let p = 0.6

  // console.log('Inside Vacant seats');
  for (let flightData of testSet) {
    // console.log(flightData);
    if (flightData.date === reqDate) {
      reqInputs = flightData.input
      break
    }
  }

  if (flight === 'jet') {
    reqInputs[0] = 1; reqInputs[1] = 0; reqInputs[2] = 0; reqInputs[3] = 0
  } else if (flight === 'set') {
    reqInputs[0] = 0; reqInputs[1] = 1; reqInputs[2] = 0; reqInputs[3] = 0
  } else if (flight === 'fly') {
    reqInputs[0] = 0; reqInputs[1] = 0; reqInputs[2] = 1; reqInputs[3] = 0
  } else {
    reqInputs[0] = 0; reqInputs[1] = 0; reqInputs[2] = 0; reqInputs[3] = 1
  }

  // console.log('Input to neural network ', reqInputs)
  const output = myNetwork.activate(reqInputs)
  console.log('THE OUTPUT IS: ', output)
  let num = 0

  for (var i = 0; i < output.length; i++) {
    if (output[i].toFixed(2) > 0.8) {
      p = output[i].toFixed(2)
      num = num + (Math.pow(2, (output.length - i - 1))) / (output[i].toFixed(2))
    }
  }
  num = Math.floor(num)
  console.log('Final Number: ', num)
  return {num, p}
}

module.exports = getVacantSeats
