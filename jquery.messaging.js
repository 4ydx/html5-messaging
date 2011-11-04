/*
 * jQuery HTML5 messaging plugin 1.0.0
 * https://github.com/4ydx/html5-messaging
 *
 * Copyright 2011, Nathan Findley 
 * http://4ydx.com
 *
 * Licensed under the GNU General Public License, version 2:
 * http://opensource.org/licenses/GPL-2.0
 */
(function($) {
  'use strict';
  /*
   * The jQuery messaging plugin prepares senders or receivers.
   * You can have one of each on the page.  I might try to come up with
   * a more complex mechanism of allowing multiple senders and
   * receivers on a page.
   *
   * 2 Scenarios:
   * 1) A receiver:
   *    The receiver sits and waits for incoming messages on the windows 
   *    message event.  When messages arrive, the receiver does some sort 
   *    of processing of the message.  
   *
   *    The receiver might reply to incoming messages.  If so, a 'reply' method
   *    must be defined.  This external method gives the page an opportunity to
   *    process a message before replying.
   *
   * 2) A sender:
   *    The sender knows who they are trying to communicate with and initiates
   *    this communication.  Messages are sent.
   *
   *    The sender may choose to receive incoming messages.
   */
  $.fn.messaging = function(params) {
    var null_function = function() {}
    var settings      = { 
      /* If true, all messages must match the specified domain */
      'strict'   : true,
      /* 
       * Domain
       *
       * -- State 'send_only', 'send_and_receive'
       * Required. The domain to send the message to.
       *
       * -- State 'receive_only', 'receive_and_reply'
       * Optional. The domain that incoming messages must originate from. 
       * You must use the setting 'strict' : true in conjunction with this for
       * the check to actually take place.
       */
      'domain' : '', 
      /* 
       * Determines the type of messaging available:
       *
       * 'this' must be an iframe
       * send_only         : Nothing special required.
       * send_and_receive  : A settings.received method is required
       *
       * 'this' must be the window 
       * receive_only      : A settings.received method is required
       *                     function(event, data){} 
       *
       * receive_and_reply : A settings.received method is required
       *                     function(event, data, callback){} 
       *
       *                     You can then trigger the reply by calling: 
       *                     callback.call();
       */
      'state'    : 'send_and_receive',
      /* A function with parameters: function(event, data, callback) { } */
      'received' : null_function
    };
    var methods = {
      'init' : function(options) {
        $.extend(settings, options);

        if(!settings.domain && (settings.state.match(/^send/) || settings.strict)) {
          $.error('jQuery.messaging requires a "domain" when sending or in strict mode ');
          return;
        }
        if(!this.is("iframe") && settings.state.match(/^send/)) {
          $.error('jQuery.messaging must be called on an iframe when sending');
          return;
        }
        if(!this.is("div") && settings.state.match(/^receive/)) {
          $.error('jQuery.messaging must be called on an div when receiving');
          return;
        }
        if(settings.state.match(/receive$/) && settings.received == null_function) {
          $.error('jQuery.messaging state send_and_receive requires settings.received method ');
          return;
        }
        if(settings.state.match(/^receive/) && settings.received == null_function) {
          $.error('jQuery.messaging state receive_* requires settings.received method ');
          return;
        }
        var opt = this.data('messaging');
        if(!opt) {
          /* Set up a listener responsible for accepting incoming messages */
          if(settings.state.match(/receive/)) {
            /* I really dislike doing this, but it seems the best at the moment */
            window.jqueryMessagingId = this.attr('id');
            window.addEventListener("message", methods.received, false); 
          }
        }
        this.data('messaging', settings);

        return this;
      },
      /* Internal method that validates domains when necessary and allows for
       * replying to received messages. Users must provide their own received
       * method or initialization will fail. */
      'received' : function(event) {
        var $this    = $("#" + window.jqueryMessagingId);
        var settings = $this.data('messaging');
        if(settings.strict && event.origin !== settings.domain) { 
          /* silently fail for now */
          return; 
        }
        if(settings.state == "receive_and_reply") {
          settings.received(event, event.data, function(message) {
            //console.log('origin: ', event.origin);
            event.source.postMessage(message, event.origin);
          });
        } else {
          settings.received(event, event.data);
        }
      },
      /* Called to immediately send a message. */
      'send' : function(message) {
        var settings = this.data('messaging');
        if(!settings.state.match(/^send/)) {
          $.error('jQuery.messaging is a receiver not a sender');
          return; 
        }
        this.get(0).contentWindow.postMessage(message, settings.domain);
        return this;
      }
    };
    /* Setting up parameters. */
    if(methods[params]) {
      return methods[params].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if(typeof params === 'object' || !params) {
      return methods.init.apply(this, arguments);
    } else {
      $.error('Method ' + params + ' does not exist in jQuery.messaging');
    }
  }
})(jQuery);
