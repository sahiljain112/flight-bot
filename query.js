var jsonData = require('./data.json');

const getFlight = (date, from, to, limit) => {
  var availableFlights = [];
  var date =
  for(var flightData in jsonData){
    if(jsonData[flightData].src === from && jsonData[flightData].dest === to && jsonData[flightData].date === date)
      availableFlights.push(jsonData[flightData]);
  }
  return finalValue;
}

const getNearbyFlights = (date, from ,to, limit) => {

};

module.exports = {
  getFlight

};
