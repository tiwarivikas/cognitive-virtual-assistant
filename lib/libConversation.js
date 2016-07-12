var watson = require('watson-developer-cloud'),
  log = require('loglevel'),
  cfenv = require('cfenv')

// Create the service wrapper
var conversation = watson.conversation({
  url: 'https://gateway.watsonplatform.net/conversation-experimental/api',
  username: process.env.CONVERSATION_USERNAME || 'eeeacbb5-8377-4e18-ba4c-fe08929e7c81',
  password: process.env.CONVERSATION_PASSWORD || 'qSITh6JBvvqW',
  version_date: '2016-05-19',
  version: 'v1-experimental'
});

exports.doConversation = function(question, context, cb) {
  var workspace = process.env.WORKSPACE_ID || '0dd91079-83d3-4a11-9288-cfc87724ed08';
  if (!workspace || workspace === '<workspace-id>') {
    return res.json({'output': {'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' +
    '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' +
      'Once a workspace has been defined the intents may be imported from ' +
    '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_intents.csv">here</a> in order to get a working application.'}});
  }
  var payload = {
    workspace_id: workspace,
    context: {},
    input: {}
  };
   payload.input = {'text':question};
   if (typeof context === "undefined") {
   	payload.context = {};
   } else {
   	payload.context = context;
   }
   

  // Send the input to the conversation service
  conversation.message(payload, function(err, data) {
    if (err) {
     log.error(err)
      return cb(err);
    }
    log.info(data);
    return cb(data);
  });
}