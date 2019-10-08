var sessionID = 0;

var player1Div = $("#player1");
var player2Div = $("#player2");
var player1Button = $("#player1-name-button");
var player2Button = $("#player2-name-button");

// Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyAWL1_1stLHB3bqFh9nFOIaHNapLFBiLXY",
    authDomain: "click-counter-72785.firebaseapp.com",
    databaseURL: "https://click-counter-72785.firebaseio.com",
    projectId: "click-counter-72785",
    storageBucket: "",
    messagingSenderId: "636426432201",
    appId: "1:636426432201:web:a32b9e547561dec19ee718"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var database = firebase.database();

// Run this function every time the html body is loaded.
function checkFirstVisit() {
    // If this is the first time someone is visiting the page, then create a new session ID for them.
    if (sessionStorage.getItem("sessionID") === null) {
        sessionID = Math.floor(Math.random() * 100000);
        sessionStorage.setItem("sessionID", sessionID);
    }
}

// connectionsRef references a specific location in our database.
var connectionsRef = database.ref("/connections");

// '.info/connected' is a boolean value, true if the client is connected and false if they are not.
var connectedRef = database.ref(".info/connected");

// When the client's connection state changes...
connectedRef.on("value", function (snap) {

    // console.log(snap.val());

    // If they are connected...
    if (snap.val()) {

        sessionID = sessionStorage.getItem("sessionID");

        // Add user to the connections list.
        var con = database.ref("/connections/" + sessionID).push(true);

        console.log("New session ID: " + sessionID);

        // Remove user from the connection list when they disconnect.
        con.onDisconnect().remove();
    }
});

// SESSION ID, associate the session id with the user.
// When the user closes their browser (disconnects from the database), remove their session id
// If their session id matches with user 1 or 2, give them rock paper scissors options depending on who they are

// When player 1 enters their name...
player1Button.on("click", function (event) {
    event.preventDefault();

    var playername = $("#player1-name").val().trim();

    database.ref('users/1').set({
        playername: playername,
        playerwins: 0,
        playerlosses: 0,
        playerchoice: "none",
        playernumber: 1,
        playersessionID: sessionID
    });

    player1Button.addClass("disabled");
    player1Button.attr("disabled", true);
    $("#player1-name").attr("readonly", true);

    addRPSButtons(1);
});

// When player 2 enters their name...
player2Button.on("click", function (event) {
    event.preventDefault();

    var playername = $("#player2-name").val().trim();

    database.ref('users/2').set({
        playername: playername,
        playerwins: 0,
        playerlosses: 0,
        playerchoice: "none",
        playernumber: 2,
        playersessionID: sessionID
    });

    player2Button.addClass("disabled");
    player2Button.attr("disabled", true);
    $("#player2-name").attr("readonly", true);

    addRPSButtons(2);
});

// When a player enters their name, show the rock paper scissor options.
function addRPSButtons(thePlayer) {
    var rock = $("<button class='btn btn-primary' id='choice" + thePlayer + "' value='rock'>Rock</button>");
    var paper = $("<button class='btn btn-primary' id='choice" + thePlayer + "' value='paper'>Paper</button>");
    var scissors = $("<button class='btn btn-primary' id='choice" + thePlayer + "' value='scissors'>Scissors</button>");

    if (thePlayer === 1) {
        player1Div.append(rock);
        player1Div.append(paper);
        player1Div.append(scissors);
    } else {
        player2Div.append(rock);
        player2Div.append(paper);
        player2Div.append(scissors);
    }
}

$(document).on("click", "#choice1", function () {
    var choiceClicked = $(this);

    sessionID = sessionStorage.getItem("sessionID");

    $.get('https://click-counter-72785.firebaseio.com/.json')
        .then(function (response) {
            if (response.connections.hasOwnProperty(sessionID) === true) {

                console.log(response.users);

                if (response.users[1].playersessionID === sessionID) {
                    console.log("This is the correct player.");
                } else {
                    console.log("This is not the correct player.");
                }

                // Since they are connected, they can play the game

                // console.log("Found it!");
            } else {

                // If they are not found, then they should be removed from the database. Or they are trying to play the game without being a player.

                // console.log("Did not find it!");
            }
        });
});

database.ref('users').on("child_added", function (snapshot) {
    // storing the snapshot.val() in a variable for convenience
    var player = snapshot.val();
    console.log(snapshot.val());

    if (player.playernumber === 1) {
        $("#player1-name").val(player.playername);
        $("#player1-name").attr("readonly", true);
        player1Button.addClass("disabled");
        player1Button.attr("disabled", true);
        addRPSButtons(1);
    } else {
        $("#player2-name").val(player.playername);
        $("#player2-name").attr("readonly", true);
        player2Button.addClass("disabled");
        player2Button.attr("disabled", true);
        addRPSButtons(2);
    }

    // Handle the errors
}, function (errorObject) {
    console.log("Errors handled: " + errorObject.code);
});