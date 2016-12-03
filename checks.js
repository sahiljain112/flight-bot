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

function checkBooking ({context, entities}) {
  // var loc = firstEntityValue(entities, 'location')
  var loc = firstEntityValue(entities, 'location')

  var locTo = firstEntityValue(entities, 'to') || loc
  var locFrom = firstEntityValue(entities, 'from')
  var time = firstEntityValue(entities, 'datetime')

  // console.log('start', loc, locTo, locFrom)

  if (!context.locTo) {
    if (locTo) {
      context.locTo = locTo
      delete context.missingLocTo
    } else {
      context.missingLocTo = 'Missing location To'
    }
  }

  if (locFrom) {
    context.locFrom = locFrom
  }

  if (time) {
    context.time = time
  }

  console.log(Object.keys(context))
  return context
}

function checkLocTo ({context, entities}) {
  var locTo = firstEntityValue(entities, 'to')
  var loc = firstEntityValue(entities, 'location')
  var locFrom = firstEntityValue(entities, 'from')

  if (locTo) {
    context.locTo = locTo
    delete context.missingLocTo
  } else if (loc) {
    context.locTo = loc
    delete context.missingLocTo
  } else if (locFrom) {
    context.locTo = locFrom
    delete context.missingLocTo
  }

  return context
}

function checkLocFrom ({context, entities}) {
  var locFrom = firstEntityValue(entities, 'from')
  var loc = firstEntityValue(entities, 'location')
  var locTo = firstEntityValue(entities, 'to')
  console.log('check from', locFrom, loc, locTo)
  console.log('context from', context)
  if (!context['locFrom']) {
    if (locFrom) {
      context.locFrom = locFrom
      delete context.missingLocFrom
    } else if (loc) {
      context.locFrom = loc
      delete context.missingLocFrom
    } else if (locTo) {
      context.locFrom = locTo
      delete context.missingLocFrom
    } else {
      context.missingLocFrom = 'missing'
    }
  }
  console.log('retrung context', context)
  return context
}

function checkTime ({context, entities}) {
  var time = firstEntityValue(entities, 'datetime')

  console.log('check time', time)
  if (!context['time']) {
    if (time) {
      context.time = time
      delete context.missingTime
    } else {
      context.missingTime = 'missing it!'
    }
  }
  console.log('retrung context', context)
  return context
}

function reset ({context}) {
  Object.keys(context).forEach(k => {
    delete context[k]
  })
  return context
}

module.exports = {
  checkBooking,
  checkLocFrom,
  checkLocTo,
  checkTime,
  reset
}
