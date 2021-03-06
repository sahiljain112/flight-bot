let Wit = null
let interactive = null
try {
  // if running from repo
  Wit = require('../').Wit
  interactive = require('../').interactive
} catch (e) {
  Wit = require('node-wit').Wit
  interactive = require('node-wit').interactive
}

var {checkBooking, checkLocTo, checkLocFrom, checkTime, reset, getFlights, getVacantSeats} = require('./checks')

const accessToken = 'PULEMNT64DSFAPDJEVKBZ6C6EIVNCV2K'

// Quickstart example
// See https://wit.ai/ar7hur/quickstart

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value

  if (!val) {
    return null
  }
  return typeof val === 'object' ? val.value : val
}

const actions = {
  send (request, response) {
    const {sessionId, context, entities} = request
    const {text, quickreplies} = response
    console.log('sending...', JSON.stringify(response))
  },
  getForecast ({context, entities}) {
    var location = firstEntityValue(entities, 'location')
    if (location) {
      context.forecast = 'sunny in ' + location // we should call a weather API here
      delete context.missingLocation
    } else {
      context.missingLocation = true
      delete context.forecast
    }
    return context
  },
  checkLocTo,
  checkLocFrom,
  checkBooking,
  checkTime,
  reset,
  getFlights,
  getVacantSeats
}

const client = new Wit({accessToken, actions})
interactive(client)
