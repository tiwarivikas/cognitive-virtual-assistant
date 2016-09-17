// The Api module is designed to handle all interactions with the server

var Api = (function() {
  var requestPayload;
  var responsePayload;
  var messageEndpoint = '/api/message';
  var workspace_name;
  var workspace_description;

  //Ensure correct Worskpace ID is used for all API Calls
  var queries = {};
  if (document.location.search != "") {
     $.each(document.location.search.substr(1).split('&'),function(c,q){
      var i = q.split('=');
      queries[i[0].toString()] = i[1].toString();
    });
    if(queries.workspace_id != null) {
      messageEndpoint += "?workspace_id="+ queries.workspace_id;
    }
  }
 

  // Publicly accessible methods defined
  return {
    sendRequest: sendRequest,
    init: init,

    // The request/response getters/setters are defined here to prevent internal methods
    // from calling the methods without any of the callbacks that are added elsewhere.
    getRequestPayload: function() {
      return requestPayload;
    },
    setRequestPayload: function(newPayloadStr) {
      requestPayload = JSON.parse(newPayloadStr);
    },
    getResponsePayload: function() {
      return responsePayload;
    },
    setResponsePayload: function(newPayloadStr) {
      responsePayload = JSON.parse(newPayloadStr);
    },
    getWorkspaceName: function() {
      return workspace_name;
    },
    setWorkspaceName: function(name) {
      workspace_name = name;
    }

  };

  function init() {
    var queries = {};
    $.each(document.location.search.substr(1).split('&'),function(c,q){
      var i = q.split('=');
      queries[i[0].toString()] = i[1].toString();
    });
    if(queries.workspace_id != null) {
      // Built http request
      var http = new XMLHttpRequest();
      http.open('GET', 'https://www.ibmwatsonconversation.com/rest/v1/workspaces/' + queries.workspace_id + '?version=2016-07-11', true);
      http.setRequestHeader('Content-type', 'application/json');
      http.onreadystatechange = function() {
        if (http.readyState === 4 && http.status === 200 && http.responseText) {
          Api.setWorkspaceName(JSON.parse(http.responseText).name);
          console.log(Api.getWorkspaceName);
        }
      };

      // Send request
      http.send();
    }
    
  }

  // Send a message request to the server
  function sendRequest(text, context) {
    // Build request payload
    var payloadToWatson = {};
    if (text) {
      payloadToWatson.input = {
        text: text
      };
    }
    if (context) {
      payloadToWatson.context = context;
    }

    // Built http request
    var http = new XMLHttpRequest();
    http.open('POST', messageEndpoint, true);
    http.setRequestHeader('Content-type', 'application/json');
    http.onreadystatechange = function() {
      if (http.readyState === 4 && http.status === 200 && http.responseText) {
        Api.setResponsePayload(http.responseText);
      }
    };

    var params = JSON.stringify(payloadToWatson);
    // Stored in variable (publicly visible through Api.getRequestPayload)
    // to be used throughout the application
    if (Object.getOwnPropertyNames(payloadToWatson).length !== 0) {
      Api.setRequestPayload(params);
    }

    // Send request
    http.send(params);
  }
}());
