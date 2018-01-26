/**
 *  A pure JavaScript-based speech navigation system for websites
 *
 *  Creator: Aaron Vontell, Vontech Software LLC (aaron@vontech.org)
 *  Contributors: Aaron Vontell
 *  Indirect Contributors: 
 *      Chris Wilson - https://github.com/cwilso/volume-meter (thanks!)
 *  Version: 0.0.1-alpha
 */


// The below source up to line 102 is from https://github.com/cwilso/volume-meter
// and helps in the process of getting volume for visualization

/*
The MIT License (MIT)
Copyright (c) 2014 Chris Wilson
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*
Usage:
audioNode = createAudioMeter(audioContext,clipLevel,averaging,clipLag);
audioContext: the AudioContext you're using.
clipLevel: the level (0 to 1) that you would consider "clipping".
   Defaults to 0.98.
averaging: how "smoothed" you would like the meter to be over time.
   Should be between 0 and less than 1.  Defaults to 0.95.
clipLag: how long you would like the "clipping" indicator to show
   after clipping has occured, in milliseconds.  Defaults to 750ms.
Access the clipping through node.checkClipping(); use node.shutdown to get rid of it.
*/

function createAudioMeter(audioContext,clipLevel,averaging,clipLag) {
	var processor = audioContext.createScriptProcessor(512);
	processor.onaudioprocess = volumeAudioProcess;
	processor.clipping = false;
	processor.lastClip = 0;
	processor.volume = 0;
	processor.clipLevel = clipLevel || 0.98;
	processor.averaging = averaging || 0.95;
	processor.clipLag = clipLag || 750;

	// this will have no effect, since we don't copy the input to the output,
	// but works around a current Chrome bug.
	processor.connect(audioContext.destination);

	processor.checkClipping =
		function(){
			if (!this.clipping)
				return false;
			if ((this.lastClip + this.clipLag) < window.performance.now())
				this.clipping = false;
			return this.clipping;
		};

	processor.shutdown =
		function(){
			this.disconnect();
			this.onaudioprocess = null;
		};

	return processor;
}

function volumeAudioProcess( event ) {
	var buf = event.inputBuffer.getChannelData(0);
    var bufLength = buf.length;
	var sum = 0;
    var x;

	// Do a root-mean-square on the samples: sum up the squares...
    for (var i=0; i<bufLength; i++) {
    	x = buf[i];
    	if (Math.abs(x)>=this.clipLevel) {
    		this.clipping = true;
    		this.lastClip = window.performance.now();
    	}
    	sum += x * x;
    }

    // ... then take the square root of the sum.
    var rms =  Math.sqrt(sum / bufLength);

    // Now smooth this out with the averaging factor applied
    // to the previous sample - take the max here because we
    // want "fast attack, slow release."
    this.volume = Math.max(rms, this.volume*this.averaging);
}

// end Chris Wilson's library


// Below is the original source code for the Tommy project
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
        
        tommy.listening = false
        
        // Save configurations and settings
        tommy.config = config || []
        tommy.settings = settings || {}
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
        _buildVolumeListener()
        _reapplySettings()
        
        d("Tommy setup finished")
        
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
        d("Starting listening process")
        
        // First, execute the preClick if given
        if (tommy.settings.preClick) {
            tommy.settings.preClick()
        }
        
        // Animations and such
        tommy.fabButton.classList.add("opened-button")
        tommy.fabButton.onclick = tommy.deafen
        tommy.fabIcon.innerHTML = "&#xE029;"
        
        tommy.listening = true
        tommy.speechService.start()
    }
    
    Tommy.prototype.deafen = function(timeDelay) {
        //tommy.fabButton.classList.remove("opened-button")
        tommy.fabButton.onclick = tommy.listen
        d("Stopping listening process")
        tommy.speechService.stop()
        tommy.listening = false
    }
    
    Tommy.prototype.close = function() {
        tommy.fabIcon.innerHTML = "&#xE39F;"
        tommy.spokenPreview.innerHTML = ""
        tommy.resultPanel.style.height = "0px"
        tommy.resultPanel.style.visibility = "hidden"
        tommy.resultPanelSuggestions.innerHTML = "" // Clearing all children
        setTimeout(function() {tommy.fabButton.classList.remove("opened-button")}, 300)
    }
    
    // Private methods ----------------------------------------------------------------------------
    
    function _isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    }
    
    function _fillInDefaultSettings() {
        
        // Define small variable names for use in this JS objects
        var s = tommy.settings
        var e = function(key) {return !("undefined" === typeof(tommy.settings[key]))}
        var newSettings = {
            buttonColor: e("buttonColor") ? s.buttonColor : "#3F51B5",  // Color of the Tommy Button
            iconColor: e("iconColor") ? s.iconColor : "#FFFFFF",        // Color of the Tommy Icon
            iconRecordingColor: e("iconRecordingColor") ? s.iconRecordingColor : "#F44336", // Color of the Tommy Icon when recording
            visualizerColor: e("visualizerColor") ? s.visualizerColor : "#7986CB", // Color of the audio volume visualizer behind the Tommy icon when recording
            panelTitle: e("panelTitle") ? s.panelTitle : "Welcome to Tommy", // Title to show at the top of the Tommy suggestion panel
            font: e("font") ? s.font : "Open Sans",                     // Font family for Tommy
            debug: e("debug") ? s.debug : false,                        // Console debugging for Tommy
            disabled: e("disabled") ? s.disabled : false,               // Tommy is shown but not usable
            hidden: e("hidden") ? s.hidden : false,                     // Tommy is completely hidden
            preClick: e("preClick") ? s.preClick : undefined,           // Function that gets called first when Tommy is clicked
            fullscreen: e("fullscreen") ? s.fullscreen : false,         // If true, Tommy will display suggestions fullscreen
            fullscreenIfMobile: e("fullscreenIfMobile") ? s.fullscreenIfMobile : true,  // If true, Tommy will display full screen, but only on mobile
            emptyText: e("emptyText") ? s.emptyText : undefined,        // Text to display when Tommy couldn't make a suggestion
            emptyHTML: e("emptyHTML") ? s.emptyHTML : undefined,        // Function that generates HTML to display when no suggestion was found
            speechEnabled: e("speechEnabled") ? s.speechEnabled : true, // Allow the user to use Tommy through speech
            textEnabled: e("textEnabled") ? s.textEnabled : true,       // Allow the user to use Tommy through text
            position: e("position") ? s.position : "bottom end",        // Define the position that Tommy should display the box of suggestions
            preview: e("preview") ? s.preview : "Say what you are looking for", // Text to display as a preview before the user starts providing input.
            previewFunction: e("previewFunction") ? s.previewFunction : undefined, // Function that returns a string to display as a preview before the user starts providing input.
            feelingLucky: e("feelingLucky") ? s.feelingLucky : false,   // If true, will redirect to the highest-relevance link when done listening
            algorithm: e("algorithm") ? s.algorithm : "inclusive_one",             // A string representing which algorithm to use. See more details on this in the algorithm section
        }
        tommy.settings = newSettings
        
    }
    
    function _processConfiguration() {
        
        // Since we may have multiple algorithms / iterations of algos, choose which
        // one to use here
        _algoAlpha(true, true)
        
    }
    
    function _algoAlpha(useTitle, useDescription) {
        
        tommy.internalDefinitionMapping = {}
        for (var i = 0; i < tommy.config.length; i++) {
            var def = tommy.config[i]
            
            // Build a mapping of words to definitions
            var keywords = def.keywords.split(" ")
            if (useTitle && def.title) keywords = keywords.concat(def.title.split(" "))
            if (useDescription && def.description) keywords = keywords.concat(def.description.split(" "))
            keywords = Array.from(new Set(keywords))
            
            for (var j = 0; j < keywords.length; j++) {
                var keyword = keywords[j].toLowerCase()
                if(!tommy.internalDefinitionMapping[keyword]) tommy.internalDefinitionMapping[keyword] = []
                tommy.internalDefinitionMapping[keyword].push(i)
            }
            
        }
        
        d("Definition configuration finished")
        d(tommy.internalDefinitionMapping)
        
    }
    
    function _buildSpeechRecognition() {
        
        tommy.speechService = new (window.SpeechRecognition || 
                                   window.webkitSpeechRecognition || 
                                   window.mozSpeechRecognition || 
                                   window.msSpeechRecognition)()
        if (tommy.speechService) {
            tommy.speechService.lang = 'en-US'   // TODO: Make this dynamic
            tommy.speechService.interimResults = true
            tommy.speechService.maxAlternatives = 0
        }
        
        tommy.speechService.onaudiostart = function(event) {
            tommy.spokenPreview.style.fontStyle = "italic"
            tommy.spokenPreview.innerHTML = "Say what you are looking for"
            // Set the record color
            tommy.fabIcon.style.color = tommy.settings.iconRecordingColor
        }
        
        tommy.speechService.onaudioend = function(event) {
            //tommy.speechService.onresult({results: [[{transcript: "This is a contact test"}]]})
            tommy.fabIcon.style.color = tommy.settings.iconColor
        }
        
        // Attach listeners for speech
        tommy.speechService.onresult = function(event) {
            tommy.spokenPreview.style.fontStyle = "normal"
            tommy.spokenPreview.innerHTML = event.results[0][0].transcript
            tommy.current.payload = event.results[0][0].transcript
            _processPayload()
        }
        
        tommy.speechService.onend = function(event) {
            tommy.deafen()
        }
        
        tommy.speechService.onnomatch = function(event) {
            _displayNoResults();
        }
        
        tommy.speechService.onerror = function(event) {
            _displayNoResults();
        }
        
    }
    
    // Donation from https://github.com/cwilso/volume-meter/blob/master/main.js
    function _buildVolumeListener() {
        
        // monkeypatch Web Audio
        window.AudioContext = window.AudioContext || window.webkitAudioContext

        // grab an audio context
        tommy.audioContext = new AudioContext()

        // Attempt to get audio input
        try {
            // monkeypatch getUserMedia
            navigator.getUserMedia = 
                navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia

            // ask for an audio input
            navigator.getUserMedia(
            {
                "audio": {
                    "mandatory": {
                        "googEchoCancellation": "false",
                        "googAutoGainControl": "false",
                        "googNoiseSuppression": "false",
                        "googHighpassFilter": "false"
                    },
                    "optional": []
                },
            }, _gotStream, _didntGetStream)
        } catch (err) {
            e("Audio volume not available")
        }
        
    }
    
    function _didntGetStream() {
        e("Audio volume not available")
    }

    function _gotStream(stream) {
        
        d("Audio volume available")
        
        // Create an AudioNode from the stream.
        tommy.mediaStreamSource = tommy.audioContext.createMediaStreamSource(stream);

        // Create a new volume meter and connect it.
        tommy.meter = createAudioMeter(tommy.audioContext);
        tommy.mediaStreamSource.connect(tommy.meter);

        // kick off the visual updating
        _drawAudioVisualizer();
    }
    
    function _drawAudioVisualizer() {
        
        // clear the background
        var ctx = tommy.visualizer.getContext("2d")
        ctx.clearRect(0,0,tommy.visualizer.width,tommy.visualizer.height);
        
        if (tommy.listening) {

            // check if we're currently clipping
            ctx.fillStyle = tommy.settings.visualizerColor;

            // draw a bar based on the current volume
            ctx.beginPath();
            var volume = tommy.meter.volume < 0.01 ? 0 : tommy.meter.volume
            var distance = Math.min(volume/0.002, 23)
            ctx.arc(25, 25, distance, 0, 2 * Math.PI);
            ctx.fill();
            
        }
        
        // set up the next visual callback
        tommy.rafID = window.requestAnimationFrame( _drawAudioVisualizer );
        
    }
    
    function _addStylesheets() {
        // Add the required stylesheets (icons and fonts)
        
        var stylesheets = [
            'https://fonts.googleapis.com/icon?family=Material+Icons',
            'https://fonts.googleapis.com/css?family=Open+Sans',
            'https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.5.2/animate.min.css'
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
        tommy.container.style.bottom = '0'
        tommy.container.style.right = '0'
        tommy.container.style.marginBottom = '16px'
        tommy.container.style.marginRight = '16px'
    }
    
    function _buildTommyHTML() {
        
        // Build overall container
        var container = document.createElement("div")
        container.id = "tommy-internal-container"
        tommy.internalContainer = container
        tommy.container.appendChild(container)
        
        // Build the main button to open / start listening
        tommy.fabButton = document.createElement("div")
        tommy.fabIcon = document.createElement("i")
        tommy.visualizer = document.createElement('canvas')
        tommy.fabIcon.className = "material-icons noselect"
        tommy.fabIcon.innerHTML = '&#xE39F;'
        tommy.fabButton.id = "tommy-main-button"
        tommy.fabIcon.id = "tommy-main-button-icon"
        tommy.visualizer.id = "tommy-main-button-visualizer"
        tommy.visualizer.width = 50
        tommy.visualizer.height = 50
        container.appendChild(tommy.fabButton)
        tommy.fabButton.appendChild(tommy.visualizer)
        tommy.fabButton.appendChild(tommy.fabIcon)
        
        // Attach a tooltip, but initially hide it
        tommy.fabTooltip = document.createElement("span")
        tommy.fabTooltip.id = "fab-tooltip"
        tommy.fabTooltip.classList.add("tooltiptext")
        tommy.fabTooltip.classList.add("noselect")
        tommy.fabButton.appendChild(tommy.fabTooltip)
        
        // Have the stop button appear when moving over the icon
        /*tommy.fabButton.addEventListener("mouseenter", function(event) {
            if (tommy.listening) {
                tommy.cachedFabIcon = tommy.fabIcon.innerHTML
                tommy.fabIcon.innerHTML = '&#xE047;'
            }
        });
        tommy.fabButton.addEventListener("mouseleave", function(event) {
            if (tommy.listening) {
                tommy.fabIcon.innerHTML = tommy.cachedFabIcon
            }
        });*/
        
        // Attach the entry text to the button
        tommy.spokenPreview = document.createElement("span")
        tommy.spokenPreview.id = "tommy-button-spoken-preview"
        tommy.fabButton.appendChild(tommy.spokenPreview)
        
        // Now build the results panel
        tommy.resultPanel = document.createElement("div")
        tommy.resultPanel.id = "result-panel"
        tommy.resultPanel.style.height = "0px"
        tommy.resultPanel.style.visibility = "hidden"
        
        // Attach title close button to this panel
        tommy.resultPanelTop = document.createElement("div")
        tommy.resultPanelTop.id = "result-panel-top"
        tommy.resultPanelTopTitle = document.createElement("span")
        tommy.resultPanelTopTitle.id = "result-panel-top-title"
        tommy.resultPanelCloseIcon = document.createElement("i")
        tommy.resultPanelCloseIcon.className = "material-icons noselect"
        tommy.resultPanelCloseIcon.innerHTML = '&#xE5CD;'
        tommy.resultPanelCloseIcon.id = "result-panel-close-icon"
        tommy.resultPanelCloseIcon.onclick = tommy.close
        
        tommy.resultPanelTop.appendChild(tommy.resultPanelTopTitle)
        tommy.resultPanelTop.appendChild(tommy.resultPanelCloseIcon)
        tommy.resultPanel.appendChild(tommy.resultPanelTop)
        
        // Attach the suggestion section
        tommy.resultPanelSuggestions = document.createElement("div")
        tommy.resultPanelSuggestions.id = "result-panel-suggestions"
        tommy.resultPanel.appendChild(tommy.resultPanelSuggestions)
        
        container.appendChild(tommy.resultPanel)
        
    }
    
    function _reapplySettings() {
        
        // First apply the button color
        tommy.fabButton.style.background = tommy.settings.buttonColor
        
        // Then the icon color
        if (!tommy.listening) tommy.fabIcon.style.color = tommy.settings.iconColor
        
        // Then the recording color
        if (tommy.listening) tommy.fabIcon.style.color = tommy.settings.iconRecordingColor
        
        // Visualizer gets filled automatically each time, so we don't need to initially set anything
        
        // Then the panel title
        tommy.resultPanelTopTitle.innerHTML = tommy.settings.panelTitle
        
        // Then the font
        tommy.container.style.fontFamily = tommy.settings.font
        
        // Disabled / enable Tommy
        // TODO: Remove hover effect when disabled
        // TODO: Properly position the Tooltip
        if (tommy.settings.disabled) {
            tommy.fabButton.classList.add("tooltip")
            tommy.fabButton.style.cursor = "default"
            tommy.fabTooltip.innerHTML = "Tommy is disabled"
            tommy.fabButton.onclick = function() {}
        } else {
            tommy.fabButton.classList.remove("tooltip")
            tommy.fabButton.style.cursor = "pointer"
            tommy.fabTooltip.innerHTML = ""
            tommy.fabButton.onclick = tommy.listen;
        }
        
        if (tommy.settings.hidden) {
            tommy.container.style.display = "none"
        } else {
            tommy.container.style.display = undefined
        }
        
        
        
    }
    
    function _processPayload() {
        
        // First, get the current payload, and construct a list of keywords
        var p = tommy.current.payload
        var keywords = p.split(" ")
        keywords = _removeArticlesAndTrivialWords(keywords)
        
        var scores = {}
        for (var i = 0; i < keywords.length; i++) {
            var keyword = keywords[i].toLowerCase()
            var possible = tommy.internalDefinitionMapping[keyword] || []
            for (var e = 0; e < possible.length; e++) {
                var entry = possible[e]
                if(!scores[entry]) {
                    scores[entry] = 1
                } else {
                    scores[entry] += 1
                }
            }
        }
        
        if (Object.keys(scores).length == 0) {
            _displayNoResults()
        } else {
            _displaySuggestions(scores)
        }
        
    }
    
    function _removeArticlesAndTrivialWords(list) {
        
        let arr = ['the', 'of', 'for', 'a', 'and', 'to'];
        return list.filter(e => !arr.includes(e));
        
    }
    
    function _displaySuggestions(indexedScores) {
        
        tommy.resultPanel.style.visibility = "visible"
        tommy.resultPanelSuggestions.innerHTML = "" // Clearing all children
        
        // For each scored item, display HTML for that page
        var indices = Object.keys(indexedScores).sort(function(a, b) {return indexedScores[a] - indexedScores[b]})
        for (var i = 0; i < indices.length; i++) {
            
            var index = parseInt(indices[i])
            
            // Create elements
            var suggestionDiv = document.createElement("div")
            suggestionDiv.classList.add("suggestion-item")
            var title = document.createElement("p")
            title.classList.add("suggestion-title")
            var description = document.createElement("p")
            description.classList.add("suggestion-description")
            suggestionDiv.appendChild(title)
            suggestionDiv.appendChild(description)
            
            // Load element information
            title.innerHTML = tommy.config[index].title
            description.innerHTML = tommy.config[index].description
            
            // Attach to the panel
            tommy.resultPanelSuggestions.appendChild(suggestionDiv)
            
        }
        
        tommy.resultPanel.style.height = _calculateNeededHeight()
        
    }
    
    function _displayNoResults() {
        
        d("No suggestions could be made; display no results result")
        
        var element = null
        
        if (tommy.settings.emptyHTML) {
            element = tommy.settings.emptyHTML()
        } else if (tommy.settings.emptyText) {
            var textElement = document.createElement("p")
            textElement.id = "no-results-text"
            textElement.innerHTML = tommy.settings.emptyText
            element = textElement
        } else {
            
        }
        
        tommy.resultPanel.style.visibility = "visible"
        tommy.resultPanelSuggestions.innerHTML = "" // Clearing all children
        tommy.resultPanelSuggestions.appendChild(element)
        tommy.resultPanel.style.height = _calculateNeededHeight()
        
        console.log("No results")
    }
    
    function _calculateNeededHeight() {
        
        console.log(tommy.resultPanelTop.offsetHeight)
        console.log(tommy.resultPanelSuggestions.offsetHeight)
        var height = tommy.resultPanelTop.offsetHeight + tommy.resultPanelSuggestions.offsetHeight + 16
        return height + "px"
        
    }
    
    // HTML Definitions ---------------------------------------------------------------------------
    
    var TommyContainer = document.registerElement('tommy-container', {
        prototype: Object.create(HTMLElement.prototype)
    });
        
    // Library development methods ----------------------------------------------------------------
        
    function d(message) {
        if (tommy.settings.debug) console.log(message)
    }
        
    function e(message) {
        if (tommy.settings.debug) console.error(message)
    }

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