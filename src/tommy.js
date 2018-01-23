/**
 *  A pure JavaScript-based speech navigation system for websites
 *
 *  Creator: Aaron Vontell, Vontech Software LLC (aaron@vontech.org)
 *  Contributors: Aaron Vontell
 *  Version: 0.0.1-alpha
 */

;(function() {
    'use strict'
    
    var tommy
    
    // Public methods and constructor -------------------------------------------------------------
    
    function Tommy(id, config, settings) {
        
        // Support instantiation without the `new` keyword.
        if (typeof this === 'undefined' || Object.getPrototypeOf(this) !== Tommy.prototype) {
              return new Tommy(id, config, settings)
        }
        
        // Setup important infrastructure and information
        tommy = this
        tommy.version = '0.0.1-alpha'
        
        // Construct useful properties
        tommy.context = {
            payload: null,
            previous: null,
            timeSpent: null
        }
        
        tommy.current = {
            suggestions: [],
            payload: null
        }
        
        // Save configurations and settings
        tommy.config = config
        tommy.settings = settings
        _addStylesheets()
        _fillInDefaultSettings()
        _processConfiguration()
        
        // Build the speech recognition and check if speech is available
        _buildSpeechRecognition()
        if (!tommy.isSpeechSupported()) {
            console.log("Tommy disabled - not available in this browser")
            return
        }
        
        // Build Tommy views
        tommy.container = document.getElementById(id);
        if (tommy.container == null) {
            console.error("Given id for Tommy object <tommy-container> not found - given id was '" + JSON.stringify(id) + "'")
            return
        }

        _positionTommy()
        _buildTommyHTML()
        
        if (tommy.settings.debug) console.log("Tommy setup finished");
        
    }
    
    /**
     * Determines if speech is supported.
     * @return True if speech is available in the user's browser
     */
    Tommy.prototype.isSpeechSupported = function() {
        return tommy.speechService != null
    }
    
    Tommy.prototype.open = function() {
        
    }
    
    Tommy.prototype.listen = function(timeLimit) {
        if (tommy.settings.debug) console.log("Starting listening process")
        tommy.speechService.start()
    }
    
    Tommy.prototype.deafen = function(timeDelay) {
        if (tommy.settings.debug) console.log("Stopping listening process")
        tommy.speechService.stop()
    }
    
    Tommy.prototype.close = function() {
        
    }
    
    // Private methods ----------------------------------------------------------------------------
    
    
    function _fillInDefaultSettings() {
        
        // Define small variable names for use in this JS objects
        var s = tommy.settings
        var e = function(key) {!("undefined" === typeof(tommy.settings[key]))}
        var newSettings = {
            buttonColor: e("buttonColor") ? s.buttonColor : "#3F51B5",  // Color of the Tommy Button
            iconColor: e("iconColor") ? s.iconColor : "#FFFFFF",        // Color of the Tommy Icon
            font: e("font") ? s.font : "Lato",                          // Font family for Tommy
            debug: e("debug") ? s.debug : false,                        // Console debugging for Tommy
            disabled: e("disabled") ? s.disabled : false,               // Tommy is shown but not usable
            hidden: e("hidden") ? s.hidden : false,                     // Tommy is completely hidden
            preClick: e("preClick") ? s.preClick : undefined,           // Function that gets called first when Tommy is clicked
            clickOutside: e("clickOutside") ? s.clickOutside : undefined, // Function that gets called when Tommy is done being interacted with
            fullscreen: e("fullscreen") ? s.fullscreen : false,         // If true, Tommy will display suggestions fullscreen
            fullscreenIfMobile: e("fullscreenIfMobile") ? s.fullscreenIfMobile : true,  // If true, Tommy will display full screen, but only on mobile
            emptyText: e("emptyText") ? s.emptyText : undefined,        // Text to display when Tommy couldn't make a suggestion
            emptyHTML: e("emptyHTML") ? s.emptyHTML : undefined,        // Function that generates HTML to display when no suggestion was found
            speechEnabled: e("speechEnabled") ? s.speechEnabled : true, // Allow the user to use Tommy through speech
            textEnabled: e("textEnabled") ? s.textEnabled : true,       // Allow the user to use Tommy through text
            direction: e("direction") ? s.direction : "bottom end",     // Define the direction that Tommy should display the box of suggestions
            feelingLucky: e("feelingLucky") ? s.feelingLucky : false,   // If true, will redirect to the highest-relevance link when done listening
            strictGrammar: e("strictGrammar") ? s.strictGrammar : true, // If true, only words in the definitions will be considered
        }
        tommy.settings = newSettings
        
    }
    
    function _processConfiguration() {
        
    }
    
    function _buildSpeechRecognition() {
        tommy.speechService = new (window.SpeechRecognition || 
                                   window.webkitSpeechRecognition || 
                                   window.mozSpeechRecognition || 
                                   window.msSpeechRecognition)();
        if (tommy.speechService) {
            tommy.speechService.lang = 'en-US'   // TODO: Make this dynamic
            tommy.speechService.interimResults = false
            tommy.speechService.maxAlternatives = 5
        }
        
        // Attach listeners
        tommy.speechService.onresult = function(event) {
            console.log('You said: ', event.results[0][0].transcript)
        }
        
        var events = [
         'onaudiostart',
         'onaudioend',
         'onend',
         'onerror',
         'onnomatch',
         'onresult',
         'onsoundstart',
         'onsoundend',
         'onspeechend',
         'onstart'
        ]
        events.forEach(function(eventName) {
            tommy.speechService[eventName] = function(e) {
                console.log(eventName, e);
            };
        });
        
    }
    
    function _addStylesheets() {
        // Add the required stylesheets (icons and fonts)
        
        var stylesheets = [
            'https://fonts.googleapis.com/icon?family=Material+Icons',
            'https://fonts.googleapis.com/css?family=Open+Sans'
        ]
        
        var head  = document.getElementsByTagName('head')[0]
        for (var i = 0; i < stylesheets.length; i++) {
            var style = stylesheets[i]
            var link  = document.createElement('link')
            link.rel  = 'stylesheet'
            link.type = 'text/css'
            link.href = style
            link.media = 'all'
            head.appendChild(link)
        }
        
    }
    
    function _positionTommy() {
        tommy.container.style.position = 'fixed'
        tommy.container.style.height = '50px'
        tommy.container.style.width = '50px'
        tommy.container.style.bottom = '0'
        tommy.container.style.right = '0'
        tommy.container.style.marginBottom = '16px'
        tommy.container.style.marginRight = '16px'
    }
    
    function _buildTommyHTML() {
        
        // Build overall container
        var container = document.createElement("div")
        container.id = "tommy-internal-container"
        tommy.container.appendChild(container)
        
        // Build the main button to open / start listening
        var tommyButton = document.createElement("div")
        var tommyIcon = document.createElement("i")
        tommyIcon.classList = "material-icons noselect"
        tommyIcon.innerHTML = '&#xE39F;'
        tommyButton.id = "tommy-main-button"
        tommyIcon.id = "tommy-main-button-icon"
        tommyButton.style.background = tommy.settings.buttonColor
        tommyIcon.style.color = tommy.settings.iconColor
        tommyButton.onclick = tommy.listen;
        container.appendChild(tommyButton)
        tommyButton.appendChild(tommyIcon)
    }
    
    function _displaySuggestions() {
        
    }
    
    // HTML Definitions ---------------------------------------------------------------------------
    
    var TommyContainer = document.registerElement('tommy-container', {
        prototype: Object.create(HTMLElement.prototype)
    });

    // Module wrapper -----------------------------------------------------------------------------
    
    if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
        define(function () {
            return Tommy
        })
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = Tommy
    } else {
        window.Tommy = Tommy
    }
    
})();