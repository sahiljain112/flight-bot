var synaptic = require('synaptic')
var mapping = require('../../mapping.js')

const Layer = synaptic.Layer
const Network = synaptic.Network
const Trainer = synaptic.Trainer

const inputLayer = new Layer(8)
const hiddenLayer = new Layer(20)
const outputLayer = new Layer(6)

inputLayer.project(hiddenLayer)
hiddenLayer.project(outputLayer)

const myNetwork = new Network({
  input: inputLayer,
  hidden: [hiddenLayer],
  output: outputLayer
})

var trainingSet = [
  {
    input: [0, 0, 1, 0, 0, 1, 0, 1],
    output: [0, 0, 0, 1, 0, 1]
  },
  {
    input: [0, 1, 0, 0, 0, 1, 0, 0],
    output: [0, 0, 1, 1, 0, 0]
  },
  {
    input: [1, 0, 0, 0, 1, 0, 0, 0],
    output: [0, 0, 1, 1, 1, 0]
  },
  {
    input: [0, 0, 1, 0, 0, 1, 0, 1],
    output: [0, 0, 1, 0, 0, 0]
  },
  {
    input: [0, 0, 0, 1, 0, 1, 0, 0],
    output: [0, 0, 1, 0, 1, 0, 1]
  },
  {
    input: [1, 0, 1, 0, 0, 0, 1, 1],
    output: [0, 0, 0, 0, 0, 1]
  },
  {
    input: [0, 0, 1, 0, 0, 1, 0, 1],
    output: [0, 0, 1, 1, 0, 0]
  }
]
// var trainingSet = require('./training.json');
const trainer = new Trainer(myNetwork)
trainer.train(trainingSet, {
  rate: 0.2,
  iterations: 2000,
  error: 0.1,
  shuffle: true,
  log: 1,
  cost: Trainer.cost.CROSS_ENTROPY
})

console.log('Done training')

const testNetwork = () => {
  const output = myNetwork.activate([0, 1, 0, 0, 1, 0, 0, 1])
  let num = 0

  for (var i = 0; i < output.length; i++) {
    console.log('Output', output[i].toFixed(2))
    if (output[i].toFixed(2) > 0.8) {
      num = num + Math.pow(2, (output.length - i - 1))
    }
  }
  console.log('Number is ', num)
}

const getVacantSeats = (flight, weather, occasion) => {
  flight = flight.toLowerCase()
  weather = weather.toLowerCase()
  occasion = occasion.toLowerCase()

  const input = mapping.flightMapping.flight
  input = input.concat(mapping.weatherMapping.weather.concat(mapping.occasionMapping.occasion))
  const output = myNetwork.activate(input)
  let num = 0

  for (var i = 0; i < output.length; i++) {
    if (output[i].toFixed(2) > 0.8) {
      num = num + Math.pow(2, (output.length - i - 1))
    }
  }

  console.log('Final Number: ', num)
  return num
}

module.exports = getVacantSeats
