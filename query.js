
var jsonData = require('./data.json')

const getFlight = (date, from, to, limit) => {
  console.log(date, from, to, limit);
  let timeCompare = '00:00:00.000-08:00'    // Will not work for midnight flight cases
  date = '' + date
  const formattedDate = (date).split('T')
  let availableFlights = []
  let count = 0

  for (let flightData in jsonData) {
    if (limit === count) {
      return availableFlights
    }

    if (jsonData[flightData].source === from && jsonData[flightData].destination === to && jsonData[flightData].date === formattedDate[0]) {
      if (formattedDate[1] === timeCompare) {
        availableFlights.push(jsonData[flightData])
        count += 1
      } else {
        const slot = findSlot(date)
        if (jsonData[flightData].slot === slot) {
          availableFlights.push(jsonData[flightData])
          count += 1
        }
      }
    }
  }

  return availableFlights
}

const findSlot = (date) => {
  const timeHours = date.getHours() - 8

  if (timeHours > 6 && timeHours <= 12) {
    return 'M'
  } else if (timeHours > 12 && timeHours <= 16) {
    return 'A'
  } else if (timeHours > 16 && timeHours <= 19) { return 'E' } else { return 'N' }
}

const getBestRecommedations = (date, from, to, limit, suggestionLimit) => {
  let formattedDate = ('' + date).split('T')
  let timeCompare = '00:00:00.000-08:00'
  date = formattedDate[0] + timeCompare

  let availableFlights = getBestFlight(date, from, to, limit)
  let bestFlights = getBestFlights(availableFlights, suggestionLimit)

  let goodNearbyFlights = []
  let tomorrow = date, previous = date

  for (let i = 0; i < limit; i++) {
    tomorrow = new Date(tomorrow.getTime() + 1000 * 60 * 60 * 24)
    goodNearbyFlights = goodNearbyFlights.concat(getFlight(tomorrow, from, to, limit))
  }

  const timeDiff = Math.abs(previous.getTime() - tomorrow.getTime())
  const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))

  if (diffDays < limit) {
    limit = diffDays
  }

  for (let i = 0; i < limit; i++) {
    previous = new Date(previous.getTime() - 1000 * 60 * 60 * 24)
    goodNearbyFlights = goodNearbyFlights.concat(getFlight(previous, from, to, limit))
  }

  bestFlights = bestFlights.concat(getBestFlights(goodNearbyFlights, suggestionLimit))
  bestFlights = bestFlights.slice(1)
  return bestFlights
}

const getBestFlights = (flights, limit) => {
  flights.sort((a, b) => {
    return a.cost - b.cost
  })

  return flights.slice(limit)
}

const checkSeatAvailablity = (date) => {
  const timeDiff = Math.abs(previous.getTime() - tomorrow.getTime())
  const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24))

  const seatsLeft = predictSeatsLeft(diffDays, Math.floor(Math.random() * 4))

  if (seatsLeft <= 5) {
    finalValue = 'Filling Fast'
  } else if (seatsLeft <= 10) {
    finalValue = 'Filling Normally'
  } else { finalValue = 'Filling Safely' }

  return [ seatsLeft, finalValue]
}

// Predicts the number of seats left based on a quadratic function. Assuming initially there are a 100 seats left!
const predictSeatsLeft = (x, r) => {
  let y = r - 100 / r
  y = y.toFixed(2)

  var f = (x - r) * ((x - r) + y)
  return f
}

module.exports = {
  getFlight,
  getBestRecommedations
}
