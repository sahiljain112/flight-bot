const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

function checkBooking({context, entities}) {
    var loc =  firstEntityValue(entities, 'location');

    console.log('check');

    if (!context.locTo) {
      var locTo = firstEntityValue(entities, 'to');

      if (!locTo ) {
        context.missingLocTo = true;
      } else {
        context.locTo = locTo;
        delete context.missingLocTo;
      }
    }

    if (!context.locFrom) {
      var locFrom = firstEntityValue(entities, 'from');

      if (!locFrom) {
        context.missingLocFrom = true;
      } else {
        context.locFrom = locFrom;
        delete context.missingLocFrom;
      }
    }

    if (!context.time) {
      var time = firstEntityValue(entities, 'datetime');
      if (!time) {
        context.missingTime = true;
      } else {
        context.time = time;
        delete context.missingTime;
      }
    }


    console.log('final context', context);
    return context;
}


function checkLocTo ({context, entities}) {
  var locTo = firstEntityValue(entities, 'to');
  var loc = firstEntityValue(entities, 'location');
  var locFrom = firstEntityValue(entities, 'from');
  console.log('check to', locTo, loc, locFrom);

  if (locTo) {
    context.locTo = locTo;
    delete context.missingLocTo;
  } else if (loc) {
    context.locTo = loc;
    delete context.missingLocTo;
  } else if (locFrom) {
    context.locTo = locFrom;
    delete context.missingLocTo;
  }

  return context;
}


function checkLocFrom ({context, entities}) {
  var locFrom = firstEntityValue(entities, 'from');
  var loc = firstEntityValue(entities, 'location');
  var locTo = firstEntityValue(entities, 'to');
  console.log('check from', locFrom, loc, locTo);
  if (locFrom) {
    context.locFrom = locFrom;
    delete context.missingLocFrom;
  } else if (loc) {
    context.locFrom = loc;
    delete context.missingLocFrom;
  } else if (locTo) {
    context.locFrom = locTo;
    delete context.missingLocFrom;
  }
  console.log('retrung context', context);
  return context;
}

function checkTime ({context, entities}) {
  var time = firstEntityValue(entities, 'datetime');

  console.log('check time', time);
  if (time) {
    context.time = time;
    delete context.missingTime;
  }
  console.log('retrung context', context);
  return context;
}

module.exports = {
  checkBooking,
  checkLocFrom,
  checkLocTo,
  checkTime
}
