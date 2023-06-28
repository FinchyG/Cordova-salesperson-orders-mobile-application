
// Execute in strict mode
"use strict";

// Declare a MegamaxSale object for use by the HTML view
var controller;

document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    console.log("Running cordova-" + cordova.platformId + "@" + cordova.version);
    // Create the MegamaxSale object for use by the HTML view
    controller = new MegamaxSale();
}

// JavaScript "class" containing the model, providing controller "methods" for the HTML view
function MegamaxSale() {
    console.log("Creating controller/model");

    // PRIVATE VARIABLES AND FUNCTIONS - available only to code inside the controller/model
    
    var BASE_GET_URL = "http://137.108.68.13/openstack/api/";
        
    var BASE_URL = BASE_GET_URL;
    
    // Variables to store details of currently displayed widget to ease functionality
    // FR1.2 Allow the widget catalogue to be navigated with Previous and Next buttons
    var currentWidgetArrayItem = 0;
    var currentWidgetDesc = "";
    
    // Variables to store View elements
    // FR1.2 Show widget image and caption
    var widgetImage = document.getElementById("widgetImage");
    var widgetCaption = document.getElementById("widgetCaption");
    
    // FR1.4 Display the sum of ordered items including VAT at a rate of 20%
    var orderTable = document.getElementById("orderTable");
    
    // FR1.1 When Begin Order is clicked validate that the userid is nonempty
    var userIDInput = document.getElementById("userID");
    var passwordInput = document.getElementById("password");
    
    // FR1.3 Currently displayed widget is added to order with amount and agreed price
    var clientIDInput = document.getElementById("clientID");
    var orderAmountInput = document.getElementById("orderAmount");
    var agreedPriceInput = document.getElementById("agreedPrice");
    
    // Variables to store API data and avoid repetitive API calls
    var widgetData;
    var clientData;
    var orderID;
    var userOrders;
    var clientLon;
    var clientLat;
    var date = new Date();

    // HERE Maps code
    // https://developer.here.com/documentation/maps/3.1.19.2/dev_guide/topics/map-controls-ui.html
    // https://developer.here.com/documentation/maps/3.1.19.2/dev_guide/topics/map-events.html

    // Initialize the platform object:
    var platform = new H.service.Platform({
        apikey: "FProRL5cjWtiuvSgl13WrA"
    });
    // Obtain the default map types from the platform object:
    var defaultLayers = platform.createDefaultLayers();
    // Instantiate (and display) a map object:
    var map = new H.Map(
        document.getElementById("mapContainer"),
        defaultLayers.vector.normal.map,
        {
            zoom: 15,
            center: { lat: 52.02953190, lng: -0.69105890 }
        }
    );

    // Create the default UI:
    var ui = H.ui.UI.createDefault(map, defaultLayers);
    var mapSettings = ui.getControl("mapsettings");
    var zoom = ui.getControl("zoom");
    var scalebar = ui.getControl("scalebar");
    mapSettings.setAlignment("top-left");
    zoom.setAlignment("top-left");
    scalebar.setAlignment("top-left");
    // Enable the event system on the map instance:
    var mapEvents = new H.mapevents.MapEvents(map);
    // Instantiate the default behavior, providing the mapEvents object:
    new H.mapevents.Behavior(mapEvents);

    var markers = []; // array of markers that have been added to the map

    // FR2.2 When Update Map is clicked a marker should be placed to display
    // the location of orders centred on clients’ addresses
    function addMarkerToMap(orderLon, orderLat) {
        
        // Create a coordinate point from order longitude and latitude
        let point = {
           lng: orderLon,
           lat: orderLat
        };
                
        // Create a new marker object with point data and add to map
        let marker = new H.map.DomMarker(point);
        markers.push(marker);
        map.addObject(marker);
    }

    // Clear any existing order markers from the map
    // FR2.2 When Update Map is clicked a marker should be placed to display
    // the location of orders centred on clients’ addresses
    function clearMarkersFromMap() {
        
        markers.forEach(function (marker) {
            if (marker) {
                map.removeObject(marker);
            }
        });
        markers = [];
    }
    
    // Try obtain device location and centre map, otherwise catch error to allow 
    // app to continue functioning
    // FR2.1 Display a Map for the area around the current location of the 
    // salesperson when placing orviewing an order
    function centreMap() {
        
        function onSuccess(position) {
            
            var point = {
                lng: position.coords.longitude,
                lat: position.coords.latitude
            };
            map.setCenter(point);
        }

        function onError(error) {
            alert("Error centring map on your location: ", error);
        }

        // Get the device location and pass it to onSuccess function
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: true
        });
    }

    // FR1.2 Show widget catalogue image, details and price
    function getWidgetCatalogue(userID, password) {
        
        function onSuccess(data) {
            
            if (data.status === "success") {
                // Set global variable widgetData to received data
                widgetData = data.data;
                
                // Set view figure image and caption to first item in received data
                widgetImage.src = widgetData[0].url;
                currentWidgetDesc = widgetData[0].description;
                widgetCaption.innerText = currentWidgetDesc + "\n Price in pence: " +
                        widgetData[0].pence_price;
            } else {
                alert(data.status + " : " + data.message);
            }
        }
        // Create and send API request for widget data
        let url = BASE_URL + "widgets";
        $.ajax(url, { type: "GET", data: { userid: userID, password: password},
            success: onSuccess });        
    }

    // FR1.2 navigate widgets with previous and next buttons
    function displayPreviousWidget() {

        // Test whether first widget in array and if so select last
        if (currentWidgetArrayItem === 0) {
            currentWidgetArrayItem = Object.keys(widgetData).length - 1;
        } else { // select widget before current widget
            currentWidgetArrayItem = currentWidgetArrayItem - 1;
        }
            
        // Set view figure image and caption to widger before the one currently displayed
        widgetImage.src = widgetData[currentWidgetArrayItem].url;
        currentWidgetDesc = widgetData[currentWidgetArrayItem].description;
        widgetCaption.innerText = currentWidgetDesc + "\n Price in pence: " +
                widgetData[currentWidgetArrayItem].pence_price;
    }
    
    // FR1.2 navigate widgets with previous and next buttons
    function displayNextWidget() {
        
        // Test whether last widget in array and if so select first
        if (currentWidgetArrayItem === Object.keys(widgetData).length - 1) {
            currentWidgetArrayItem = 0;
        } else { // // select widget after current widget
            currentWidgetArrayItem = currentWidgetArrayItem + 1;
        }
            
        // Set view figure image and caption to catalogue item before the one
        // currently displayed
        widgetImage.src = widgetData[currentWidgetArrayItem].url;
        currentWidgetDesc = widgetData[currentWidgetArrayItem].description;
        widgetCaption.innerText = currentWidgetDesc + "\n Price in pence: " +
                widgetData[currentWidgetArrayItem].pence_price;
    }    
    
    // FR1.3 Currently displayed widget is added to order with amount and agreed price
    function createOrderTable(userID, password, clientID) {
                
        function onSuccess(data) {
            if (data.status === "success" && clientID !== "") {
                
                // Set global variable to received data
                clientData = data.data;
                
                // Retrieve longitude and latitude of client address so order can be created
                getClientCoords(userID, password, clientID, clientData);
                
                // Change content of top row of order table
                orderTable.rows[0].cells[0].innerText = clientData[0].name + "\n" +
                        clientData[0].address;
                orderTable.rows[0].cells[1].innerText = date;
                
                // Create three additinoal rows for subtotal, VAT and total
                
                let newRow = orderTable.insertRow(orderTable.rows.length);
                let cell1 = newRow.insertCell(0);
                let cell2 = newRow.insertCell(1);
                cell1.innerText = "Subtotal";

                let newRow2 = orderTable.insertRow(orderTable.rows.length);
                cell1 = newRow2.insertCell(0);
                cell2 = newRow2.insertCell(1);
                cell1.innerText = "VAT";

                 let newRow3 = orderTable.insertRow(orderTable.rows.length);
                cell1 = newRow3.insertCell(0);
                cell2 = newRow3.insertCell(1);
                cell1.innerText = "Total";
            
            } else if (clientID === "") {
                alert("No client ID provided.");
            } else {
                alert(data.status + " : " + data.message);
            }
        }
        // Create and send API request for client data
        let url = BASE_URL + "clients/" + clientID;
        $.ajax(url, { type: "GET", data: { userid: userID, password: password},
            success: onSuccess });
    }
    
    // Retrieve longitude and latitude of client address so orcer can be created
    function getClientCoords(userID, password, clientID, clientData) {
        
        function onSuccess(data) {
            clientLon = data[0].lon;
            clientLat = data[0].lat;
            
            // Add order to orders table in database
            createOrderInOrdersDBTable(userID, password, clientID, clientLat, clientLon);
        }
        nominatim.get(clientData[0].address, onSuccess);
    }
    
    // FR1.3 Add order to orders database table and get its order ID
    function createOrderInOrdersDBTable(userID, password, clientID, clientLat, clientLon) {
        
        function onSuccess(data) {
            if (data.status === "success") {
                orderID = data.data[0].id;
            } else {
                alert("Order has not been added: ", data.message);
            }
        }
        
        // Create and send API instructions to create a new order
        let url = BASE_URL + "orders";
        $.ajax(url, { type: "POST", data: { userid: userID, password: password,
            client_id: clientID, latitude: clientLat, longitude: clientLon},
            success: onSuccess});       
    }
    
    // FR1.4 Display the sum of ordered items including VAT at a rate of 20%
    function addOrderToTable(orderAmount, agreedPrice) {
        
        // Create new row with widget description, amount ordered, agreed price,
        // and order cost
        let newRow = orderTable.insertRow(orderTable.rows.length - 3);
        let cell1 = newRow.insertCell(0);
        let cell2 = newRow.insertCell(1);
        cell1.innerText = currentWidgetDesc + "\n Amount ordered: " + orderAmount +
                "\n Agreed price: " + agreedPrice;
        cell2.innerText = Number(orderAmount * agreedPrice);
        
        // Calculate and display subtotal, VAT, and total of all order items
        let subtotal = 0;
        
	for (let i = 1; i < orderTable.rows.length - 3; i++) {
		subtotal = subtotal + Number(orderTable.rows[i].cells[1].innerText);
	}
        
        orderTable.rows[orderTable.rows.length - 3].cells[1].innerText = subtotal;
	orderTable.rows[orderTable.rows.length - 2].cells[1].innerText = subtotal * .2;
	orderTable.rows[orderTable.rows.length - 1].cells[1].innerText = subtotal * 1.2;
    }
    
    // FR1.3 Currently displayed widget is added to order items table in database 
    // with amount and agreed price
    function addOrderItemToDB(userID, password, agreedPrice, orderAmount) {
        
        function onSuccess(data) {
            if (data.status === "success") {
                console.log("Order item added to DB: ", data);
            } else {
                alert("Order item not added to database: ", data.message);
            }
        
        // Create and send API instructions to create a new order item
        let url = BASE_URL + "order_items";
        $.ajax(url, { type: "POST", data: { userid: userID, password: password,
            order_id: orderID, widget_id: widgetData[0].id, number: orderAmount, 
            pence_price: agreedPrice}, success: onSuccess});        
        }
    }
    
    // FR1.5 When End Order is clicked the current order is closed
    function endOrderProcess() {
        // Clear order table of total rows and any order items
        while(orderTable.rows.length > 1) {
            orderTable.deleteRow(-1);
        }

        // Revert text of order table first row to initial text on app opening
        orderTable.rows[0].cells[0].innerText = "Order Details: added items will appear below";
        orderTable.rows[0].cells[1].innerText = "";

        // Clear order text inputs
        clientIDInput.value = ""; 
        orderAmountInput.value = "";
        agreedPriceInput.value = "";
    }
    
    // FR2.2 When Update Map is clicked a marker should be placed to display
    // the location of orders centred on clients’ addresses
    function addUserOrdersToMap() {
        
        let userID = userIDInput.value;
        let password = passwordInput.value;
        
        // Try to centre map on client address, otherwise catch error to allow app 
        // to continue functioning
        try {
            var point = {
                lng: clientLon,
                lat: clientLat,
            };
            console.log("For client markers Lon is: " + clientLon + "and Lat: " + clientLat);
            map.setCenter(point);            
        } 
        catch (error) {
            console.log("could not centre map on cleint address: ", error);
        }
        
        function onSuccess(data) {
            if (data.status === "success") {
                userOrders = data.data;
                
                // Clear existing markers from map
                clearMarkersFromMap();
                
                // Use retrieved data to add order markers to map
                for(let i = 0; i < userOrders.length; i++) {
                    // Test whether order was placed directly by client through 
                    // website and if so then do not add a map marker
                    if (Number(userOrders[i].latitude) !== 0) {
                        let orderLon = Number(userOrders[i].longitude);
                        let orderLat = Number(userOrders[i].latitude);
                        addMarkerToMap(orderLon, orderLat);
                    }
                }                
            } else {
                alert("Order has not been added: ", data.message);
            }        
        }
        
        // Create and send request for all user orders
        let url = BASE_URL + "orders";
        $.ajax(url, { type: "GET", data: { userid: userID, password: password},
            success: onSuccess});        
    }
    
    // CONTROLLER FUNCTIONS
    
    this.beginOrder = function () {
        // Get userID, password, and clientID data from HTML view
        let userID = userIDInput.value;
        let password = passwordInput.value;
        let clientID = clientIDInput.value;
        
        // FR1.1 validating the userid is nonempty
        if (userID === "") {
            alert("No user ID entered.");
        } else {
            // FR1.2 Show widget image, description and price
            getWidgetCatalogue(userID, password);
            // FR1.3 Display added widget order with amount and price
            createOrderTable(userID, password, clientID);
            
            // FR2.1 Centre map on salesperson's location when placing an order
            try {
                centreMap();
            }
            catch (error) {
                console.error("Error calling centreMap", error);
                alert("Error centring map on your location: ", error);            
            }
        }
    };                                                                                                                                                                                                                                                                                                                                                                                    
    
    // FR1.2 Navigate widgets with previous and next buttons
    this.previousWidget = function () {
        displayPreviousWidget();
    };
    
    this.nextWidget = function () {
        displayNextWidget();
    };
    
    // FR1.3 Currently displayed widget is added to order with amount and price
    this.addOrder = function () {
        // Get required values from View
        let userID = userIDInput.value;
        let password = passwordInput.value;       
        let orderAmount = orderAmountInput.value;
        let agreedPrice = agreedPriceInput.value;
                
        // Check user has input values for amount and price (userID and password
        // fields having already been checked by the beginOrder function), if not
        //  alert them, otherwise proceed 
        if (orderAmount === "") {
            alert("No order amount entered.");
        } else if (agreedPrice === "") { 
           alert("No agreed price entered."); 
        } else {
            addOrderToTable(orderAmount, agreedPrice);
            addOrderItemToDB(userID, password, orderAmount, agreedPrice);
        }     
    };
    
    // FR1.5 When End Order is clicked the current order is closed
    this.endOrder = function () {
        endOrderProcess();
    };
    
    // FR2.2 When Update Map is clicked a marker should be placed to display
    // the location of orders centred on clients’ addresses
    this.updateMap = function () {
        addUserOrdersToMap();
    };
}    