var jsonData = require('./data.json');

const getFlight = (date, from, to, limit) => {

  String timeCompare = '00:00:00.000-08:00';
  date = '' + date;
  const formattedDate = (date).split("T");
  let availableFlights = [];
  let count = 0;

  for (let flightData in jsonData){

    if(limit === count)
      return availableFlights;

    if(jsonData[flightData].source === from && jsonData[flightData].destination === to && jsonData[flightData].date === formattedDate[0]) {
       if(formattedDate[1] === timeCompare){
          availableFlights.push(jsonData[flightData]);
          count += 1;
        }

      else {
          const slot = findSlot(date);
          if(jsonData[flightData].slot === slot){
             availableFlights.push(jsonData[flightData]);
             count += 1;
           }
        }
      }

  }

}

const findSlot = (date) => {

  const timeHours = date.getHours() - 8;

  if(timeHours > 6 && timeHours <= 12)
    return 'M';
  else if( timeHours > 12 && timeHours <= 16)
    return 'A';
  else if(timeHours > 16 && timeHours <= 19)
    return 'E';
  else
    return 'N';
};

const getNearbyFlights = (date, from ,to, limit) => {

  let goodNearbyFlights = [];
  for(let i = 0; i < limit; i++){
      let tomorrow = new Date().setDate(date.getDate()+1);
      goodNearbyFlights = goodNearbyFlights + getFlight( ,from, to, limit);
  }
  
};

module.exports = {
  getFlight,
  getNearbyFlights
};
