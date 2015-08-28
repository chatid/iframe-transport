module.exports = {

  // When this needs to be tested across browsers:
  //   - https://github.com/ariya/phantomjs/issues/11289#issuecomment-38880333
  //   - http://stackoverflow.com/a/2490876
  //   - http://stackoverflow.com/a/18614037
  //   - https://developer.mozilla.org/en-US/docs/Web/API/Document/createEvent#Notes
  dispatchEvent: function(target, name, params, builtInEventName, paramsOrder) {
    var bubbles = (params && params.bubbles != null) ? params.bubbles : false,
        cancelable = (params && params.cancelable != null) ? params.cancelable : false,
        paramsArray = [], event, i;

    if (target.dispatchEvent) {

      if (builtInEventName) {
        try {
          // Chrome, Safari, Firefox
          event = new window[builtInEventName](name, params);
        } catch (e) {
          // PhantomJS
          event = document.createEvent(builtInEventName);

          // event.init<BuiltInEvent> only accepts params as ordered arguments
          // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/initMouseEvent
          if (params && paramsOrder) {
            for (i = 0; i < paramsOrder.length; i++) {
              paramsArray.push(params[paramsOrder[i]]);
            }
          }

          event['init' + builtInEventName].apply(event, [name, bubbles, cancelable].concat(paramsArray));
        }
      } else {
        event = params ? new CustomEvent(name, params) : new Event(name);
      }

      target.dispatchEvent(event);

    } else {
      // IE 8 (not tested)
      event = document.createEventObject(builtInEventName);
      target.fireEvent('on' + name, event);
    }

  }

};
