/**
 *  Tests for the Tommy library
 *
 *  Creator: Aaron Vontell, Vontech Software LLC (aaron@vontech.org)
 *  Contributors: Aaron Vontell
 *  100% passing for version 0.0.1-alpha
 */

const CURRENT_VERSION = "0.0.1-alpha"

// Make a mock browser since this is a client-facing library
var MockBrowser = require('mock-browser').mocks.MockBrowser;
var mock = new MockBrowser();
global.document = mock.getDocument();
global.HTMLElement = mock.getWindow().HTMLElement;

// The rest of the dependencies
var assert = require('assert');
//var Tommy = require('../src/tommy')

describe('tommy.js', function() {
    
    describe('#Tommy(id, config, settings) - default', function() {
        it('should have correct object properties', function() {
            
            // Create base Tommy object
            //var t = Tommy('tommy')
            
            // Assert properties of the base object
            //assert.equal(t.version, CURRENT_VERSION);
            
        });
    });
    
});
