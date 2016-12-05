/*
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* jshint node: true, devel: true */

const
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),
  request = require('request'),
  env = require('node-env-file'),
  Wit = require('node-wit').Wit,
  log = require('node-wit').log

var checks = require('./checks')
var checkLocTo = checks.checkLocTo
var checkLocFrom = checks.checkLocFrom
var checkTime = checks.checkTime
var checkBooking = checks.checkBooking
var reset = checks.reset
var getFlights = checks.getFlights
const hashCode = function (str) {
  var hash = 0, i, chr, len
  if (str.length === 0) return hash
  for (i = 0, len = str.length; i < len; i++) {
    chr = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0// Convert to 32bit integer
  }
  return parseInt(hash)
}
if (process.env.NODE_ENV !== 'production') {
  env(__dirname + '/.env')
}

var app = express()
app.set('port', process.env.PORT || 5000)
app.set('view engine', 'ejs')
app.use(bodyParser.json({ verify: verifyRequestSignature }))
app.use(express.static('public'))

//
//
// const APP_SECRET = (process.env.MESSENGER_APP_SECRET) ?
//   process.env.MESSENGER_APP_SECRET :
//   config.get('appSecret')
//
// // Arbitrary value used to validate a webhook
// const VALIDATION_TOKEN = (process.env.MESSENGER_VALIDATION_TOKEN) ?
//   (process.env.MESSENGER_VALIDATION_TOKEN) :
//   config.get('validationToken')
//
// // Generate a page access token for your page from the App Dashboard
// const PAGE_ACCESS_TOKEN = (process.env.MESSENGER_PAGE_ACCESS_TOKEN) ?
//   (process.env.MESSENGER_PAGE_ACCESS_TOKEN) :
//   config.get('pageAccessToken')
//
// // URL where the app is running (include protocol). Used to point to scripts and
// // assets located at this address.
// const SERVER_URL = (process.env.SERVER_URL) ?
//   (process.env.SERVER_URL) :
//   config.get('serverURL')
//
const APP_SECRET = process.env.MESSENGER_APP_SECRET
const VALIDATION_TOKEN = process.env.VALIDATION_TOKEN
const SERVER_URL = process.env.SERVER_URL
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN
const WIT_TOKEN = process.env.WIT_TOKEN

console.log('Environment variables.................', process.env.SERVER_URL, '\n', process.env.PAGE_ACCESS_TOKEN, '\n', process.env.MESSENGER_APP_SECRET, '\n', process.env.VALIDATION_TOKEN, '\n', process.env.WIT_TOKEN)

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL)) {
  console.error('Missing config values')
  process.exit(1)
}

app.get('/webhook', function (req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VALIDATION_TOKEN) {
    console.log('Validating webhook')
    res.status(200).send(req.query['hub.challenge'])
  } else {
    console.error('Failed validation. Make sure the validation tokens match.')
    res.sendStatus(403)
  }
})

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page.
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */

const sessions = {}

const findOrCreateSession = (fbid) => {
  let sessionId
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k
    }
  })
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString()
    sessions[sessionId] = {fbid: fbid, context: {}}
  }
  return sessionId
}

// Our bot actions
const actions = {
  send ({sessionId}, {text}) {
    // Our bot has something to say!
    // Let's retrieve the Facebook user whose session belongs to
    const recipientId = sessions[sessionId].fbid
    if (recipientId) {
      // Yay, we found our recipient!
      // Let's forward our bot response to her.
      // We return a promise to let our bot know when we're done sending
      var messageData = {
        recipient: {
          id: recipientId
        },
        message: {
          text: text,
          metadata: 'DEVELOPER_DEFINED_METADATA'
        }
      }

      return callSendAPI(messageData)
    } else {
      console.error('Oops! Couldn\'t find user for session:', sessionId)
      // Giving the wheel back to our bot
      return Promise.resolve()
    }
  },
  checkLocTo,
  checkLocFrom,
  checkBooking,
  checkTime,
  reset,
  getFlights
}

const wit = new Wit({
  accessToken: WIT_TOKEN,
  actions,
  logger: new log.Logger(log.INFO)
})

app.post('/webhook', function (req, res) {
  var data = req.body

  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function (pageEntry) {
      var pageID = pageEntry.id
      var timeOfEvent = pageEntry.time

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function (messagingEvent) {
        if (messagingEvent.optin) {
          receivedAuthentication(messagingEvent)
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent)
        } else if (messagingEvent.delivery) {
          receivedDeliveryConfirmation(messagingEvent)
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent)
        } else if (messagingEvent.read) {
          receivedMessageRead(messagingEvent)
        } else if (messagingEvent.account_linking) {
          receivedAccountLink(messagingEvent)
        } else {
          console.log('Webhook received unknown messagingEvent: ', messagingEvent)
        }
      })
    })

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200)
  }
})

/*
 * This path is used for account linking. The account linking call-to-action
 * (sendAccountLinking) is pointed to this URL.
 *
 */
app.get('/authorize', function (req, res) {
  var accountLinkingToken = req.query.account_linking_token
  var redirectURI = req.query.redirect_uri

  // Authorization Code should be generated per user by the developer. This will
  // be passed to the Account Linking callback.
  var authCode = '1234567890'

  // Redirect users to this URI on successful login
  var redirectURISuccess = redirectURI + '&authorization_code=' + authCode

  res.render('authorize', {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess
  })
})

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature (req, res, buf) {
  var signature = req.headers['x-hub-signature']

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error("Couldn't validate the signature.")
  } else {
    var elements = signature.split('=')
    var method = elements[0]
    var signatureHash = elements[1]

    var expectedHash = crypto.createHmac('sha1', APP_SECRET)
                        .update(buf)
                        .digest('hex')

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.")
    }
  }
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to
 * Messenger" plugin, it is the 'data-ref' field. Read more at
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication (event) {
  var senderID = event.sender.id
  var recipientID = event.recipient.id
  var timeOfAuth = event.timestamp

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger'
  // plugin.
  var passThroughParam = event.optin.ref

  console.log('Received authentication for user %d and page %d with pass ' +
    "through param '%s' at %d", senderID, recipientID, passThroughParam,
    timeOfAuth)

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  sendTextMessage(senderID, 'Authentication successful')
}

/*
 * Message Event
 *
 * This event is called when a message is sent to your page. The 'message'
 * object format can vary depending on the kind of message that was received.
 * Read more at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-received
 *
 * For this example, we're going to echo any text that we get. If we get some
 * special keywords ('button', 'generic', 'receipt'), then we'll send back
 * examples of those bubbles to illustrate the special message bubbles we've
 * created. If we receive a message with an attachment (image, video, audio),
 * then we'll simply confirm that we've received the attachment.
 *
 */
function receivedMessage (event) {
  var senderID = event.sender.id
  var recipientID = event.recipient.id
  var timeOfMessage = event.timestamp
  var message = event.message

  console.log('Received message for user %d and page %d at %d with message:',
    senderID, recipientID, timeOfMessage)
  console.log(JSON.stringify(message))

  var isEcho = message.is_echo
  var messageId = message.mid
  var appId = message.app_id
  var metadata = message.metadata

  // You may get a text or attachment but not both
  var messageText = message.text
  var messageAttachments = message.attachments
  var quickReply = message.quick_reply
  const sessionId = findOrCreateSession(senderID)

  if (isEcho) {
    // Just logging message echoes to console
    console.log('Received echo for message %s and app %d with metadata %s',
      messageId, appId, metadata)
    return
  } else if (quickReply) {
    var quickReplyPayload = quickReply.payload
    console.log('Quick reply for message %s with payload %s',
      messageId, quickReplyPayload)

    sendTextMessage(senderID, 'Quick reply tapped')
    return
  }

  if (messageText) {
    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.

    wit.runActions(
          sessionId, // the user's current session
          messageText, // the user's message
          sessions[sessionId].context // the user's current session state
        ).then((context) => {
          // Our bot did everything it has to do.
          // Now it's waiting for further messages to proceed.
          console.log('Waiting for next user messages')

          // Based on the session state, you might want to reset the session.
          // This depends heavily on the business logic of your bot.
          // Example:
          // if (context['done']) {
          //   delete sessions[sessionId]
          // }

          // Updating the user's current session state
          sessions[sessionId].context = context
        })
        .catch((err) => {
          console.error('Oops! Got an error from Wit: ', err.stack || err)
        })

    // switch (messageText) {
    //   case 'test':
    //     sendTextMessage(senderID, 'Test Message')
    //     break
    //   default:
    //     sendTextMessage(senderID, 'Yo Sahil')
    // }
  } else if (messageAttachments) {
    sendTextMessage(senderID, 'Message with attachment received')
  }
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation (event) {
  var senderID = event.sender.id
  var recipientID = event.recipient.id
  var delivery = event.delivery
  var messageIDs = delivery.mids
  var watermark = delivery.watermark
  var sequenceNumber = delivery.seq

  if (messageIDs) {
    messageIDs.forEach(function (messageID) {
      console.log('Received delivery confirmation for message ID: %s',
        messageID)
    })
  }

  console.log('All message before %d were delivered.', watermark)
}

/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 *
 */
function receivedPostback (event) {
  var senderID = event.sender.id
  var recipientID = event.recipient.id
  var timeOfPostback = event.timestamp

  // The 'payload' param is a developer-defined field which is set in a postback
  // button for Structured Messages.
  var payload = event.postback.payload

  console.log("Received postback for user %d and page %d with payload '%s' " +
    'at %d', senderID, recipientID, payload, timeOfPostback)

  // When a postback is called, we'll send a message back to the sender to
  // let them know it was successful
  sendTextMessage(senderID, 'Postback called')
}

/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 *
 */
function receivedMessageRead (event) {
  var senderID = event.sender.id
  var recipientID = event.recipient.id

  // All messages before watermark (a timestamp) or sequence have been seen.
  var watermark = event.read.watermark
  var sequenceNumber = event.read.seq

  console.log('Received message read event for watermark %d and sequence ' +
    'number %d', watermark, sequenceNumber)
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 *
 */
function receivedAccountLink (event) {
  var senderID = event.sender.id
  var recipientID = event.recipient.id

  var status = event.account_linking.status
  var authCode = event.account_linking.authorization_code

  console.log('Received account link event with for user %d with status %s ' +
    'and auth code %s ', senderID, status, authCode)
}

function sendTypingOn (recipientId) {
  console.log('Turning typing indicator on')

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: 'typing_on'
  }

  callSendAPI(messageData)
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff (recipientId) {
  console.log('Turning typing indicator off')

  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: 'typing_off'
  }

  callSendAPI(messageData)
}

function sendTextMessage (recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: 'DEVELOPER_DEFINED_METADATA'
    }
  }

  callSendAPI(messageData)
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI (messageData) {
  if (messageData.message.text.indexOf('$CATCH_FLIGHT') >= 0) {
    const timings = {
      A: 'in afternoon',
      E: 'in evening',
      N: 'at night',
      M: 'in the morning'
    }
    console.log(messageData.message.text, '$CATCH_FLIGHT'.length);
    console.log('rec', messageData.message.text.slice('$CATCH_FLIGHT'.length))

    var f = JSON.parse(messageData.message.text.slice('$CATCH_FLIGHT'.length))

    console.log('receipt', f)
    messageData = {
      recipient: messageData.recipient,
      message: {
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"button",
            "text":"What do you want to do next?",
            "buttons":[
              {
                "type":"web_url",
                "url":"https://petersapparel.parseapp.com",
                "title":"Show Website"
              },
              {
                "type":"postback",
                "title":"Start Chatting",
                "payload":"USER_DEFINED_PAYLOAD"
              }
            ]
          }
        }
      }
    }
    // messageData.message = {
    //   attachment: {
    //     type: 'template',
    //     payload: {
    //       template_type: 'receipt',
    //       recipient_name: 'Sourishdas Gupta',
    //       order_number: '4159881',
    //       currency: 'INR',
    //       timestamp: new Date().getUTCSeconds(),
    //       elements: [{
    //         title: f.airline,
    //         subtitle: `A ${f.airline}-${hashCode(f.airline + f.source + f.slot + f.destination) % 1000} airlines flight, will depart ${timings[f.slot]}.
    //            The duration of this flight would be ${f.duration}`,
    //         quantity: 1,
    //         price: f.cost,
    //         currency: 'INR',
    //         image_url: 'https://cdn2.iconfinder.com/data/icons/app-types-in-grey/512/airplane_512pxGREY.png'
    //       }]
    //     }
    //   }
    // }
    console.log(messageData);
  }
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id
      var messageId = body.message_id

      if (messageId) {
        console.log('Successfully sent message with id %s to recipient %s',
          messageId, recipientId)
      } else {
        console.log('Successfully called Send API for recipient %s',
        recipientId)
      }
    } else {
      console.error('Failed calling Send API', response.statusCode, response.statusMessage, body.error)
    }
  })
}

// Start server
// Webhooks must be available via SSL with a certificate signed by a valid
// certificate authority.
app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'))
})

module.exports = app
