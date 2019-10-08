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

    // If they are connected...
    if (snap.val()) {

        sessionID = sessionStorage.getItem("sessionID");

        // Add user to the connections list.
        var con = database.ref("/connections/" + sessionID).push(true);

        // Remove user from the connection list when they disconnect.
        con.onDisconnect().remove();
    }
});

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

// If any of the player 1 options are clicked...
$(document).on("click", "#choice1", function () {
    var choiceClicked = $(this);
    sessionID = sessionStorage.getItem("sessionID");

    $.get('https://click-counter-72785.firebaseio.com/.json')
        .then(function (response) {
            if (response.users[1].playersessionID === sessionID) {
                console.log("This is the correct player.");
                database.ref('users/1/playerchoice').set(choiceClicked.attr("value"));
            } else {
                console.log("This is not the correct player.");
            }
        });
});

// If any of the player 2 options are clicked...
$(document).on("click", "#choice2", function () {
    var choiceClicked = $(this);
    sessionID = sessionStorage.getItem("sessionID");

    $.get('https://click-counter-72785.firebaseio.com/.json')
        .then(function (response) {
            if (response.users[2].playersessionID === sessionID) {
                console.log("This is the correct player.");
                database.ref('users/2/playerchoice').set(choiceClicked.attr("value"));
            } else {
                console.log("This is not the correct player.");
            }
        });
});

// When a new player is added to the database, lock in their name and add the rock, paper,
// scissors button options to the screen.
database.ref('users').on("child_added", function (snapshot) {
    var player = snapshot.val();
    sessionID = sessionStorage.getItem("sessionID");

    if (player.playernumber === 1) {
        $("#player1-name").val(player.playername);
        $("#player1-name").attr("readonly", true);
        player1Button.addClass("disabled");
        player1Button.attr("disabled", true);
        if (sessionID === player.playersessionID) {
            addRPSButtons(1);
            var quitButton = $("<button class='btn btn-primary' id='quit'>Quit Game</button>");
            player1Div.append(quitButton);
        }
    } else {
        $("#player2-name").val(player.playername);
        $("#player2-name").attr("readonly", true);
        player2Button.addClass("disabled");
        player2Button.attr("disabled", true);
        if (sessionID === player.playersessionID) {
            addRPSButtons(2);
            var quitButton = $("<button class='btn btn-primary' id='quit'>Quit Game</button>");
            player2Div.append(quitButton);
        }
    }
    // Handle the errors
}, function (errorObject) {
    console.log("Errors handled: " + errorObject.code);
});