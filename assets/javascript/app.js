var sessionID = 0;
var player1Div = $("#player1");
var player2Div = $("#player2");
var player1Content = $("#player1-content");
var player2Content = $("#player2-content");
var player1Button = $("#player1-name-button");
var player2Button = $("#player2-name-button");
var deckDiv = $("#deck");

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
    var rock = $("<button class='btn btn-primary choice" + thePlayer + "' value='rock'>Rock</button>");
    var paper = $("<button class='btn btn-primary choice" + thePlayer + "' value='paper'>Paper</button>");
    var scissors = $("<button class='btn btn-primary choice" + thePlayer + "' value='scissors'>Scissors</button>");

    if (thePlayer === 1) {
        player1Content.append(rock);
        player1Content.append(paper);
        player1Content.append(scissors);
    } else {
        player2Content.append(rock);
        player2Content.append(paper);
        player2Content.append(scissors);
    }
}

// If any of the player 1 options are clicked...
$(document).on("click", ".choice1", function () {
    var choiceClicked = $(this);
    sessionID = sessionStorage.getItem("sessionID");

    // Add the choice to the player 1 data
    $.get('https://click-counter-72785.firebaseio.com/.json')
        .then(function (response) {
            if (response.users[1].playersessionID === sessionID) {
                database.ref('users/1/playerchoice').set(choiceClicked.attr("value"));
                $(".choice1").addClass("disabled");
                $(".choice1").attr("disabled", true);
                player1Content.append("<h6>You have chosen " + choiceClicked.attr("value") + ". Please wait.</h6>");
            }
        });
});

// If any of the player 2 options are clicked...
$(document).on("click", ".choice2", function () {
    var choiceClicked = $(this);
    sessionID = sessionStorage.getItem("sessionID");

    // Add the choice to the player 2 data
    $.get('https://click-counter-72785.firebaseio.com/.json')
        .then(function (response) {
            if (response.users[2].playersessionID === sessionID) {
                database.ref('users/2/playerchoice').set(choiceClicked.attr("value"));
                $(".choice2").addClass("disabled");
                $(".choice2").attr("disabled", true);
                player2Content.append("<h6>You have chosen " + choiceClicked.attr("value") + ". Please wait.</h6>");
            }
        });
});

// When a new player is added to the database, lock in their name and add the rock, paper,
// scissors, and quit button options to the screen.
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

// When the user data changes, we want to check if the players have chosen rock, paper, or scissors
// yet. If they both have, then evaluate their choices and see who wins.
database.ref('users').on("value", function (snapshot) {
    var users = snapshot.val();

    if (users !== null && users[1] !== undefined && users[2] !== undefined) {
        var player1Choice = users[1].playerchoice;
        var player2Choice = users[2].playerchoice;

        if (player1Choice !== "none" && player2Choice !== "none") {
            deckDiv.empty();
            deckDiv.append("<h4>Player 1 chose: " + player1Choice + "</h4>");
            deckDiv.append("<h4>Player 2 chose: " + player2Choice + "</h4>");

            if (player1Choice === player2Choice) {
                deckDiv.append("<h4>It was a tie!</h4>");
            } else {
                var didPlayer1Win = checkWinCondition(player1Choice, player2Choice);
                if (didPlayer1Win) {
                    deckDiv.append("<h4>Player 1 won!</h4>");
                    modifyWins(1);
                    modifyLosses(2);
                } else {
                    deckDiv.append("<h4>Player 2 won!</h4>");
                    modifyWins(2);
                    modifyLosses(1);
                }
            }
            clearChoices();
            resetGameBoard();
        }
        // } else {
        //     console.log("Both players have not chosen yet.");
        // }
    }
    // Handle the errors
}, function (errorObject) {
    console.log("Errors handled: " + errorObject.code);
});

// Check to see who won the round.
function checkWinCondition(player1, player2) {
    if ((player1 === "rock" && player2 === "scissors") || (player1 === "scissors" && player2 === "paper") || (player1 === "paper" && player2 === "rock")) {
        console.log("Player 1 won.");
        return true;
    } else {
        console.log("Player 2 won.");
        return false;
    }
}

// Add 1 to the win count of the specified player.
function modifyWins(thePlayer) {

    // Get the current wins and add one to it.
    $.get('https://click-counter-72785.firebaseio.com/.json')
        .then(function (response) {
            var wins = response.users[thePlayer].playerwins;
            wins++;
            database.ref('users/' + thePlayer + '/playerwins').update(wins);
        });
}

// Add 1 to the loss count of the specified player.
function modifyLosses(thePlayer) {

    // Get the current losses and add one to it.
    $.get('https://click-counter-72785.firebaseio.com/.json')
        .then(function (response) {
            var losses = response.users[thePlayer].playerlosses;
            losses++;
            database.ref('users/' + thePlayer + '/playerlosses').update(losses);
        });
}

// Clear the player choices so they can play again.
function clearChoices() {
    database.ref('users/1/playerchoice').set("none");
    database.ref('users/2/playerchoice').set("none");
}

function resetGameBoard() {
    sessionID = sessionStorage.getItem("sessionID");

    // Retrieve the sessionIDs of the players.
    $.get('https://click-counter-72785.firebaseio.com/.json')
        .then(function (response) {
            var player1ID = response.users[1].playersessionID;
            var player2ID = response.users[2].playersessionID;

            if (sessionID === player1ID) {
                player1Content.empty();
                addRPSButtons(1);
            }
            if (sessionID === player2ID) {
                player2Content.empty();
                addRPSButtons(2);
            }
        });
}