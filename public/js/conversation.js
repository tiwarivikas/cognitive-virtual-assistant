// The ConversationPanel module is designed to handle
// all display and behaviors of the conversation column of the app.
/* eslint no-unused-vars: "off" */
/* global Api: true, Common: true*/

 // initial load
  var $userInput;
  $(document).ready(function() {
      //Api.init();
      $userInput = $('#textInput');
      $('.input-btn').click(conductConversation);
      /*$userInput.keyup(function(event){
          if(event.keyCode === 13) {
              conductConversation();
          }
      });*/
  });

  function conductConversation() {
      var context;
      var latestResponse = Api.getResponsePayload();
      if (latestResponse) {
        context = latestResponse.context;
      }

      // Send the user message
      Api.sendRequest($userInput.val(), context);

      // Clear input box for further messages
      $userInput.val('');
  }

var ConversationPanel = (function() {
  var audio;
  var settings = {
    selectors: {
      chatBox: '#scrollingChat',
      fromUser: '.from-user',
      fromWatson: '.from-watson',
      latest: '.latest'
    },
    authorTypes: {
      user: 'user',
      watson: 'watson'
    }
  };

  // Publicly accessible methods defined
  return {
    init: init,
    inputKeyDown: inputKeyDown,
    startDictation: startDictation,
    conductConversation: conductConversation
  };

  // Initialize the module
  function init() {
    //***********************************************
    // Text to Speech Integration - START
    //***********************************************
    var voice = 'en-US_AllisonVoice';

    audio = $('.audio').get(0);

    //***********************************************
    // Text to Speech Integration - END
    //***********************************************
    chatUpdateSetup();
    // The client displays the initial message to the end user
    displayMessage(
      {output:
        {text: ['Hello! This is Watson Cognitive Assistant.']}
      },
      settings.authorTypes.watson);
    setupInputBox();
  }

  

  // Set up callbacks on payload setters in Api module
  // This causes the displayMessage function to be called when messages are sent / received
  function chatUpdateSetup() {
    var currentRequestPayloadSetter = Api.setRequestPayload;
    Api.setRequestPayload = function(newPayloadStr) {
      currentRequestPayloadSetter.call(Api, newPayloadStr);
      displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.user);
    };

    var currentResponsePayloadSetter = Api.setResponsePayload;
    Api.setResponsePayload = function(newPayloadStr) {
      currentResponsePayloadSetter.call(Api, newPayloadStr);
      displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.watson);
    };
  }

  function setupInputBox() {
    var input = document.getElementById('textInput');
    var dummy = document.getElementById('textInputDummy');
    var padding = 3;

    if (dummy === null) {
      var dummyJson = {
        'tagName': 'div',
        'attributes': [{
          'name': 'id',
          'value': 'textInputDummy'
        }]
      };

      dummy = Common.buildDomElement(dummyJson);
      ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height', 'text-transform', 'letter-spacing'].forEach(function(index) {
        dummy.style[index] = window.getComputedStyle( input, null ).getPropertyValue( index );
      });

      document.body.appendChild(dummy);
    }

    input.addEventListener('input', function() {
      if (this.value === '') {
        this.classList.remove('underline');
        this.setAttribute('style', 'width:' + '100%');
        this.style.width = '80%';
      } else {
        this.classList.add('underline');
        var txtNode = document.createTextNode(this.value);
        dummy.textContent = txtNode.textContent;
        var widthValue = ( dummy.offsetWidth + padding) + 'px';
        this.setAttribute('style', 'width:' + widthValue);
        this.style.width = widthValue;
      }
    });

    fireEvent(input, 'input');
  }

  function fireEvent(element, event) {
    var evt;
    if (document.createEventObject) {
      // dispatch for IE
      evt = document.createEventObject();
      return element.fireEvent('on' + event, evt);
    }
    // otherwise, dispatch for Firefox, Chrome + others
    evt = document.createEvent('HTMLEvents');
    evt.initEvent(event, true, true); // event type,bubbling,cancelable
    return !element.dispatchEvent(evt);
  }

  // Display a user or Watson message that has just been sent/received
  function displayMessage(newPayload, typeValue) {
    var isUser = isUserMessage(typeValue);
    var textExists = (newPayload.input && newPayload.input.text)
      || (newPayload.output && newPayload.output.text);
   if (isUser !== null && textExists) {
       //Call Speech to Text
       if (!isUser) {
        var msg = newPayload.output.text[0];
        /*
        if (msg.indexOf("~~~") >= 0) {

            var intent = newPayload.intents[0]!=null? newPayload.intents[0].intent:'';
            var entity_value = newPayload.entities[0]!=null? newPayload.entities[0].value:'';
            var entity = newPayload.entities[0]!=null? newPayload.entities[0].entity:'';
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
            
             newPayload.output.text[0] = msg;
        } 
        */
        text2Speech(newPayload.output.text);
      }
      // Create new message DOM element
     
      var dataObj = isUser ? newPayload.input : newPayload.output;
      var arrText;
      if(!Array.isArray(dataObj.text)) {
        arrText = new Array();
        arrText[0] = dataObj.text;
      } else {
        arrText = dataObj.text;
      }

      arrText.forEach(function(element){
        var messageDiv = buildMessageDomElement(element, isUser);
        var chatBoxElement = document.querySelector(settings.selectors.chatBox);
        var previousLatest = chatBoxElement.querySelector((isUser
                ? settings.selectors.fromUser : settings.selectors.fromWatson)
                + settings.selectors.latest);
        // Previous "latest" message is no longer the most recent
        if (previousLatest) {
          previousLatest.classList.remove('latest');
        }

        chatBoxElement.appendChild(messageDiv);
        // Class to start fade in animation
        messageDiv.classList.add('load');
        // Move chat to the most recent messages when new messages are added
        scrollToChatBottom();

        loadAdditionalItems(element, messageDiv);

        })
      }
  }
  //Load Pictures and other items as part of Conversation
  function loadAdditionalItems(text, messageDiv) {
    switch (text) {
                case 'Great ! You had a taxing week. You should take a break': 
                    var oImg=document.createElement("img");
                    oImg.setAttribute('src', '/img/relax.jpg');
                    oImg.setAttribute('alt', 'na');
                    oImg.setAttribute('width', '100%');
                    messageDiv.appendChild(oImg);
                    // Move chat to the most recent messages when new messages are added
                    scrollToChatBottom();
                  break;
              }
  }
  // Checks if the given typeValue matches with the user "name", the Watson "name", or neither
  // Returns true if user, false if Watson, and null if neither
  // Used to keep track of whether a message was from the user or Watson
  function isUserMessage(typeValue) {
    if (typeValue === settings.authorTypes.user) {
      return true;
    } else if (typeValue === settings.authorTypes.watson) {
      return false;
    }
    return null;
  }

  // Constructs new DOM element from a message payload
  function buildMessageDomElement(text, isUser) {
    
    var messageJson = {
      // <div class='segments'>
      'tagName': 'div',
      'classNames': ['segments'],
      'children': [{
        // <div class='from-user/from-watson latest'>
        'tagName': 'div',
        'classNames': [(isUser ? 'from-user' : 'from-watson'), 'latest'],
        'children': [{
          // <div class='message-inner'>
          'tagName': 'div',
          'classNames': ['message-inner'],
          'children': [{
            // <p>{messageText}</p>
            'tagName': 'p',
            'text': text
          }]
        }]
      }]
    };

    return Common.buildDomElement(messageJson);
  }

  // Scroll to the bottom of the chat window (to the most recent messages)
  // Note: this method will bring the most recent user message into view,
  //   even if the most recent message is from Watson.
  //   This is done so that the "context" of the conversation is maintained in the view,
  //   even if the Watson message is long.
  function scrollToChatBottom() {
    var scrollingChat = document.querySelector('#scrollingChat');
    var messages = scrollingChat.children;
    var lastMessage = messages[messages.length - 1];

    // If the most recent message is from Watson,
    // scroll the latest message to the top of the section, rather than the bottom
    var top = false;
    var scrollEl = lastMessage.querySelector(settings.selectors.fromWatson
            + settings.selectors.latest);
    if (scrollEl) {
      top = true;
    }

    // Scroll to the latest message sent by the user
    scrollEl = scrollingChat.querySelector(settings.selectors.fromUser
            + settings.selectors.latest);
    if (scrollEl) {
      scrollEl.scrollIntoView({
        'behavior': 'smooth', // Only supported by Firefox, but including doesn't break other browsers
        'block': (top ? 'start' : 'end')
      });
    }
  }

  // Handles the submission of input
  function inputKeyDown(event, inputBox) {
    // Submit on enter key, dis-allowing blank messages
    if (event.keyCode === 13 && inputBox.value) {
      // Retrieve the context from the previous server response
      var context;
      var latestResponse = Api.getResponsePayload();
      if (latestResponse) {
        context = latestResponse.context;
      }

      // Send the user message
      Api.sendRequest(inputBox.value, context);

      // Clear input box for further messages
      inputBox.value = '';
      fireEvent(inputBox, 'input');
    }
  }
  //***********************************************
  // Text to Speech Integration - START
  //***********************************************

  function synthesizeRequest(options, audio) {
      var sessionPermissions = 1;
      var downloadURL = '/api/synthesize' +
          '?voice=' + options.voice +
          '&text=' + encodeURIComponent(options.text) +
          '&X-WDC-PL-OPT-OUT=' +  sessionPermissions;

      if (options.download) {
          downloadURL += '&download=true';
          window.location.href = downloadURL;
          return true;
      }
      audio.pause();
      try {
          audio.currentTime = 0;
      } catch(ex) {
          // ignore. Firefox just freaks out here for no apparent reason.
      }
      audio.src = downloadURL;
      audio.play();
      return true;
  }

  function text2Speech(text) {
    var utteranceOptions = {
        text: text,
        voice: 'en-US_AllisonVoice',
        sessionPermissions: 1
    };

    synthesizeRequest(utteranceOptions, audio);
  }

  function startDictation() {

    if (window.hasOwnProperty('webkitSpeechRecognition')) {

        $('#mic-img').attr("src", "img/mic-animate.gif");


        var recognition = new webkitSpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.lang = "en-US";
        recognition.start();

        recognition.onresult = function(e) {
            $('#mic-img').attr("src", "img/mic.gif");
            document.getElementById('textInput').value
                = e.results[0][0].transcript;
            recognition.stop();
           // document.getElementById('send-btn').submit();
            $('.input-btn').click();
           // $('#textInput').trigger(jQuery.Event('keypress', {which: 13}));
        };

        recognition.onerror = function(e) {
            $('#mic-img').attr("src", "img/mic.gif");
            recognition.stop();
        }


    }
  } 

  //***********************************************
  // Text to Speech Integration - END
  //**********************************************'

}());
