/**
 *  Tests for the Tommy library
 *
 *  Creator: Aaron Vontell, Vontech Software LLC (aaron@vontech.org)
 *  Contributors: Aaron Vontell
 *  100% passing for version 0.0.1-alpha
 */

const CURRENT_VERSION = "0.0.1-alpha"

// Make a mock browser (and configure) since this is a client-facing library
var MockBrowser = require('mock-browser').mocks.MockBrowser
var mock = new MockBrowser()
global.document = mock.getDocument()
global.window = mock.getWindow()
global.HTMLElement = window.HTMLElement
function empty() {
    return null
}
document.registerElement = empty
window.SpeechRecognition = empty

// The rest of the dependencies
var assert = require('assert')
var Tommy = require('../src/tommy')

describe('tommy.js', function() {
    
    describe('#Tommy(id, config, settings) - default', function() {
        it('should have correct object properties/settings', function() {
            
            // Create base Tommy object
            var t = Tommy('tommy')
            
            // Assert properties of the base object
            assert.equal(t.version, CURRENT_VERSION)
            
            // Assert correct default settings
            assert.equal(t.settings.buttonColor, "#3F51B5")
            assert.equal(t.settings.iconColor, "#FFFFFF")
            assert.equal(t.settings.iconRecordingColor, "#F44336")
            assert.equal(t.settings.visualizerColor, "#7986CB")
            assert.equal(t.settings.panelTitle, "Welcome to Tommy")
            assert.equal(t.settings.font, "Open Sans")
            assert.equal(t.settings.debug, false)
            assert.equal(t.settings.disabled, false)
            assert.equal(t.settings.hidden, false)
            assert.equal(t.settings.preClick, undefined)
            assert.equal(t.settings.fullscreen, false)
            assert.equal(t.settings.fullscreenIfMobile, true)
            assert.equal(t.settings.emptyText, undefined)
            assert.equal(t.settings.emptyHTML, undefined)
            assert.equal(t.settings.speechEnabled, true)
            assert.equal(t.settings.textEnabled, true)
            assert.equal(t.settings.position, "bottom end")
            assert.equal(t.settings.preview, "Say what you are looking for")
            assert.equal(t.settings.previewFunction, undefined)
            assert.equal(t.settings.feelingLucky, false)
            assert.equal(t.settings.algorithm, "inclusive_one")
            
        });
    });
    
    describe('#Tommy(id, config, settings) - custom settings', function() {
        it('should have correct custom object properties/settings', function() {
            
            // Create a custom settings object
            var settings = {
                debug: false,
                panelTitle: "Your Personal Assistant!",
                preClick: function() {},
                feelingLucky: true
            }
                        
            // Create base Tommy object
            var t = Tommy('tommy', null, settings)
            
            // Assert properties of the base object
            assert.equal(t.version, CURRENT_VERSION)
            
            // Assert correct default settings
            assert.equal(t.settings.buttonColor, "#3F51B5")
            assert.equal(t.settings.iconColor, "#FFFFFF")
            assert.equal(t.settings.iconRecordingColor, "#F44336")
            assert.equal(t.settings.visualizerColor, "#7986CB")
            assert.equal(t.settings.panelTitle, "Your Personal Assistant!")
            assert.equal(t.settings.font, "Open Sans")
            assert.equal(t.settings.debug, false)
            assert.equal(t.settings.disabled, false)
            assert.equal(t.settings.hidden, false)
            assert.notEqual(t.settings.preClick, undefined)
            assert.equal(t.settings.fullscreen, false)
            assert.equal(t.settings.fullscreenIfMobile, true)
            assert.equal(t.settings.emptyText, undefined)
            assert.equal(t.settings.emptyHTML, undefined)
            assert.equal(t.settings.speechEnabled, true)
            assert.equal(t.settings.textEnabled, true)
            assert.equal(t.settings.position, "bottom end")
            assert.equal(t.settings.feelingLucky, true)
            assert.equal(t.settings.algorithm, "inclusive_one")
            
        });
    });
    
});
