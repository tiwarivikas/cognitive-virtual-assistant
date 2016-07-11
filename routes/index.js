var cfenv = require('cfenv'),
  twilio = require('twilio'),
  xmlparser = require('express-xml-bodyparser'),
  bodyParser = require('body-parser'),
  log = require('loglevel')

var service = cfenv.getAppEnv().getService('twilio')

if(service == null) {
  service = {'credentials':{'accountSID':'AC4e26c9002783072ece845d15741803a7', 'authToken':'88c42dc337a7620037f84f665ffb5812'}};
}

var client = twilio(service.credentials.accountSID, service.credentials.authToken)
var number = 'Unavailable'

// Access look up the first phone number bound to the account
client.incomingPhoneNumbers.list(function (err, response) {
  if (err) {
    log.error(err)
    return
  }

  number = response.incoming_phone_numbers[0].phone_number
})

module.exports = function (app) {
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(xmlparser())

  // Hook up REST API for responding to incoming calls
  app.use('/calls', require('./calls.js'))
  // Hook up REST API for responding to incoming sms messages
  app.use('/sms', require('./sms.js'))

  // Render the index.html page with embedded twilio number
  var plates = require('express-plates').init(app)

  app.get('/tmp', function (req, res) {
    var map = plates.Map()
    map['class']('btn-danger').to('number')
    map.where('href').is('xxx').as('href').to('link')

    res.render('index', {
      data: {
        number: 'Call or SMS: ' + number,
        link: 'tel:' + number
      },
      map: map
    })
  })

  // Serve image resources
 // app.use(serveStatic('views'))
}
