/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

require('dotenv').config({silent: true});

var express = require('express');  // app server
var bodyParser = require('body-parser');  // parser for post requests
var watson = require('watson-developer-cloud');  // watson sdk
var Client = require('node-rest-client').Client;
var http = require('https');

var app = express();

//Initiate Twilio Routes
require('./routes')(app)

//Initiate Node REST Client
var client = new Client();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

// Create the service wrapper
var conversation = watson.conversation({
  url: 'https://gateway.watsonplatform.net/conversation-experimental/api',
  username: process.env.CONVERSATION_USERNAME || 'eeeacbb5-8377-4e18-ba4c-fe08929e7c81',
  password: process.env.CONVERSATION_PASSWORD || 'qSITh6JBvvqW',
  version_date: '2016-05-19',
  version: 'v1-experimental'
});

app.get('/test', function(request, response) {
  var options = {
  host: '55c718b3-187e-44ea-945e-80f139af67a8:TlADII4r43@twcservice.mybluemix.net',
  port: 443,
  path: '/api/weather/v1/geocode/45.42/75.69/observations.json?units=m&language=en-US',
  method: 'GET'
  };

  http.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
    });
  }).end();
})

// Endpoint to be call from the client side
app.post('/api/message', function(req, res) {
  doConversation(req, res);
 /* var workspace = process.env.WORKSPACE_ID || '0dd91079-83d3-4a11-9288-cfc87724ed08';
  if (!workspace || workspace === '<workspace-id>') {
    return res.json({'output': {'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' +
    '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' +
      'Once a workspace has been defined the intents may be imported from ' +
    '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_intents.csv">here</a> in order to get a working application.'}});
  }
  var payload = {
    workspace_id: workspace,
    context: {}
  };
  if (req.body) {
    if (req.body.input) {
      payload.input = req.body.input;
    }
    if (req.body.context) {
      // The client must maintain context/state
      payload.context = req.body.context;
    }
  }
  // Send the input to the conversation service
  conversation.message(payload, function(err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }
   //return res.json(updateMessage(data));
   updateMessage(data, function(data) {return res.json(data)});
   // return res.json(data);
  }); */
});

// For local development, replace username and password
var textToSpeech = watson.text_to_speech({
    version: 'v1',
    username: '652e755e-4977-4046-bb4a-173252ccb718',
    password: 'yhs1LKMfQNTV'
});

//Text to Speech Watson API call
app.get('/api/synthesize', function(req, res, next) {
    var transcript = textToSpeech.synthesize(req.query);
    transcript.on('response', function (response) {
        if (req.query.download) {
            response.headers['content-disposition'] = 'attachment; filename=transcript.ogg';
        }
    });
transcript.on('error', function(error) {
    next(error);
});
transcript.pipe(res);
});

/**
 * Updates the response text using the intent confidence
 * @param  {Object} response The response from the Conversation service
 * @return {Object}          The response with the updated message
 */
function updateMessage(response, callback) {
  var responseText = null;

  //Check for Command Mode
  var msg = response.output.text[0];
  if (msg.indexOf("~~~") >= 0) {
      var intent = response.intents[0]!=null? response.intents[0].intent:'';
      var entity_value = response.entities[0]!=null? response.entities[0].value:'';
      var entity = response.entities[0]!=null? response.entities[0].entity:'';
      if(intent != '') {
        switch ((intent + '~' + entity).toUpperCase()) {
          case 'TURN_ON~MUSIC': 
            msg = "Let me resume your favorite album from where you left yesterday. It's up now, enjoy the music!";
            break;
          case 'TURN_OFF~MUSIC':
            msg = "The Music Player has been turned off.";
            break;
          case 'TURN_ON~AC':
            msg = "The Air Conditioner has been turned on.";
            break;
          case 'TURN_OFF~AC':
            msg = "The Air Conditioner has been turned off.";
            break;
          case 'TURN_ON~LIGHT':
            msg = "The Lights have been turned on.";
            break;
          case 'TURN_OFF~LIGHT':
            msg = "The Lights have been turned off.";
            break;
          case 'TURN_ON~':
            msg = "The Device has been turned ON.";
            break;
          case 'TURN_OFF~':
            msg = "The Device has been turned off.";
            break;
        }

      }
      
      response.output.text[0] = msg;
  }
  if(response.intents && response.intents[0] && (response.intents[0].intent == "weather" || response.intents[0].intent == "travel")) {
    if(response.entities && response.entities[0] && response.entities[0].entity == "city") {
       response.output.text = "Weather of " + response.entities[0].value + " is Mostly Cloudy today. Is there anything I can help you with?";
       /* client.get("https://55c718b3-187e-44ea-945e-80f139af67a8:TlADII4r43@twcservice.mybluemix.net:443/api/weather/v1/geocode/45.42/75.69/observations.json?units=m&language=en-US", 
                    function (weatherdata, res) {
                      // parsed response body as js object 
                     // weatherdata = binArrayToJson(wdata);
                      console.log(weatherdata);
                      // raw response 
                      // console.log(response);
                      response.output.text = "Weather of " + response.entities[0].value + " is: " + weatherdata.observation.wx_phrase + " amd temperature is " + weatherdata.observation.feels_like;
                      callback(response);
          });
          
        client.get("https://maps.googleapis.com/maps/api/geocode/json?address=" + response.entities[0].value + " &key=AIzaSyBqN8hpRJnG4reeYZy_ZSWkx6zzZd4TyO4", function (data, res) {
          // parsed response body as js object 
          console.log(data);
          // raw response 
         // console.log(response);
         //response.output.text = "GeoLocation of " + response.entities[0].value + " is: " + data.results[0].geometry.location.lat + "/" + data.results[0].geometry.location.lng;
         //callback(response);
        // client.get()
         client.get("https://55c718b3-187e-44ea-945e-80f139af67a8:TlADII4r43@twcservice.mybluemix.net:443/api/weather/v1/geocode/" + 
                    data.results[0].geometry.location.lat + "%2C" + data.results[0].geometry.location.lng + 
                    "/observations.json?units=m&language=en-US", 
                    function (wdata, res) {
                      // parsed response body as js object 
                      weatherdata = binArrayToJson(wdata);
                      console.log(weatherdata);
                      // raw response 
                      // console.log(response);
                      response.output.text = "Weather of " + response.entities[0].value + " is: " + weatherdata.observation.wx_phrase + " amd temperature is " + weatherdata.observation.feels_like;
                      callback(response);
          });
        }); */
    }
  }
  callback(response);
  //return response;
}

var binArrayToJson = function(binArray)
{
	var str = "";
	for (var i = 0; i < binArray.length; i++) {
		str += String.fromCharCode(parseInt(binArray[i]));
	}
	return JSON.parse(str)
}

function doConversation(req, res) {
   var workspace = process.env.WORKSPACE_ID || '0dd91079-83d3-4a11-9288-cfc87724ed08';
  if (!workspace || workspace === '<workspace-id>') {
    return res.json({'output': {'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' +
    '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' +
      'Once a workspace has been defined the intents may be imported from ' +
    '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_intents.csv">here</a> in order to get a working application.'}});
  }
  var payload = {
    workspace_id: workspace,
    context: {}
  };
  if (req.body) {
    if (req.body.input) {
      payload.input = req.body.input;
    }
    if (req.body.context) {
      // The client must maintain context/state
      payload.context = req.body.context;
    }
  }
  // Send the input to the conversation service
  conversation.message(payload, function(err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }
   //return res.json(updateMessage(data));
   updateMessage(data, function(data) {return res.json(data)});
   // return res.json(data);
  });
}

module.exports = app;
