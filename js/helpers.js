// Execute in strict mode
"use strict";

/**
 * Use the OpenStreetMap REST API without flooding the server.
 * The API has antiflood protection on it that means we must not submit more than one request per second.
 * This function restricts requests to every five seconds, and caches responses to further reduce requests.
 *
 * v1.1 Chris Thomson / Stephen Rice: Dec 2020
 */
function NominatimService() {
    console.log("Nominatim: Creating service helper (in helpers.js)");

    // PRIVATE VARIABLES AND FUNCTIONS - available only to code inside the function

    var queue = [];
    var cache = {};
    var scheduled = null;

    function scheduleRequest(delay) {
        console.log(
            "Nominatim: Processing next request in " + delay + "ms",
            Object.assign({}, queue)
        );
        scheduled = setTimeout(processRequest, delay);
    }

    function safeCallback(item, delay) {
        try {
            // Callback with cached data
            item.callback(cache[item.address]);
        } finally {
            // Schedule next request even if callback fails
            scheduleRequest(delay);
        }
    }

    function processRequest() {
        // Stop if queue is empty
        if (queue.length === 0) {
            console.log("Nominatim: Queue complete");
            scheduled = null;
            return;
        }

        // Get the next item from the queue
        var item = queue.shift();

        // Check for cached data for this address
        if (cache[item.address]) {
            console.log("Nominatim: Data found in cache", cache[item.address]);

            // Callback and schedule the next request immediately as we did not call the API this time
            safeCallback(item, 0);
        } else {
            // Address is not cached so call the OpenStreetMap REST API
            var url =
                "http://nominatim.openstreetmap.org/search/" +
                encodeURI(item.address) +
                "?format=json&countrycodes=gb";

            var onSuccess = function (data) {
                console.log("Nominatim: Received data from " + url, data);

                // Cache the response data
                cache[item.address] = data;

                // Callback and schedule the next request in 5 seconds time:
                // This avoids flooding the API and getting locked out. 1 second should be
                // enough, but if you have several pages open then you need to wait longer
                safeCallback(item, 5000);
            };

            // Call the OpenStreetMap REST API
            console.log("Nominatim: Sending GET to " + url);
            $.ajax(url, { type: "GET", data: {}, success: onSuccess });
        }
    }

    // PUBLIC FUNCTIONS - available to the view

    // Queued/Cached call to OpenStreetMap REST API
    // address: address string to lookup
    // callback: function to handle the result of the call
    this.get = function (address, callback) {
        // Add the item to the queue
        queue.push({ address: address, callback: callback });
        console.log("Nominatim: Queued request", Object.assign({}, queue));

        // Schedule the next request immediately if not already scheduled
        if (!scheduled) scheduleRequest(0);
    };
}

var nominatim = new NominatimService();
