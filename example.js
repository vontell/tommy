/**
 *  An example for the Tommy library
 *
 *  Creator: Aaron Vontell, Vontech Software LLC (aaron@vontech.org)
 *  Contributors: Aaron Vontell
 *  Version: ex0.0.1-alpha
 */

/**
 *  A simple example of Tommy
 */
function setupTommy() {
    
    // First, we configure Tommy
    var definitions = [
        {
            path: "/index.html",                // The path destination when Tommy is clicked
            keywords: "home tommy",             // The speech keywords that cause Tommy to show up
            title: "Home Page",                 // The title for this suggestion
            description: "Home page for Tommy", // The description for the suggestion
            icon: "img/star.png",               // The icon for the the suggestion
            titleFunction: undefined,           // Instead, generate title from a function (given payload)
            descriptionFunction: undefined,     // Instead, generate description from a function (given payload)
            iconFunction: undefined,            // Instead, generate icon from a function (given payload)
            displayHTML: undefined,             // Instead, generate the entire suggestion HTML
            relevance: undefined                // A function that given a payload, returns the relevance (0-1) of a suggestion for this entry
        },
        
    ]
    
    var settings = {
        buttonColor: "#FEFEFE",     // Color of the Tommy Button
        iconColor: "#000000",       // Color of the Tommy Icon
        font: "Lato",               // Font family for Tommy
        debug: true,                // Console debugging for Tommy
        disabled: false,            // Tommy is shown but not usable
        hidden: false,              // Tommy is completely hidden
        preClick: undefined,        // Function that gets called first when Tommy is clicked
        clickOutside: undefined,    // Function that gets called when Tommy is done being interacted with
        fullscreen: false,          // If true, Tommy will display suggestions fullscreen
        fullscreenIfMobile: true,   // If true, Tommy will display full screen, but only on mobile
        emptyText: undefined,       // Text to display when Tommy couldn't make a suggestion
        emptyHTML: undefined,       // Function that generates HTML for Tommy to display when no suggestion was found
        speechEnabled: true,        // Allow the user to use Tommy through speech
        textEnabled: true,          // Allow the user to use Tommy through text
        direction: "above left",    // Define the direction that Tommy should display the box of suggestions
        feelingLucky: false,        // If true, Tommy will also redirect to the highest-relevance link when done listening
        strictGrammar: true,        // If true, only words in the definitions will be considered
    }
    
    var t = Tommy('tommy', definitions, settings)
    
    // Get the context that led to this page (null if Tommy didn't get to this page)
    var context = t.context
    console.log(context.payload)    // The full speech string used to reach this page
    console.log(context.previous)   // The path that the user came from
    console.log(context.timeSpent)  // Time spent using Tommy in the last page
    
    // Open Tommy programmatically on your own
    t.open()
    
    // Have Tommy begin listening programmatically on your own
    //t.listen()
    
    // Have Tommy stop listening programmatically on your own
    t.deafen()
    
    // Close Tommy programmatically on your own
    t.close()
    
    // Have tommy listen for only a few seconds (4 seconds)
    //t.listen(4000)
    
    // Retrieve the current suggestions and current payload
    var current = t.current.suggestions;
    var payload = t.current.payload;
    console.log(current)
    console.log(payload)
    
    // Show some basic properties of Tommy
    console.log(t.version)
    
}

setupTommy();