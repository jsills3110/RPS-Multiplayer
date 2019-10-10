var sessionID = 0;
var player1Div = $("#player1");
var player2Div = $("#player2");
var player1Content = $("#player1-content");
var player2Content = $("#player2-content");
var player1Button = $("#player1-name-button");
var player2Button = $("#player2-name-button");
var deckDiv = $("#deck");
var player1Image = $("#player1-img");
var player2Image = $("#player2-img");
var player1Wins = $("#player1-wins");
var player1Losses = $("#player1-losses");
var player2Wins = $("#player2-wins");
var player2Losses = $("#player2-losses");

var buttonBSClasses = "btn m-1";
var rockImage = "<img src='assets/images/rock.png' class='img-fluid'/>";
var scissorsImage = "<img src='assets/images/scissors.png' class='img-fluid'/>";
var paperImage = "<img src='assets/images/paper.png' class='img-fluid'/>";

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
    var rock = $("<button class='btn-dark " + buttonBSClasses + " choice" + thePlayer + "' value='rock'>Rock</button>");
    var paper = $("<button class='btn-secondary " + buttonBSClasses + " choice" + thePlayer + "' value='paper'>Paper</button>");
    var scissors = $("<button class='btn-info " + buttonBSClasses + " choice" + thePlayer + "' value='scissors'>Scissors</button>");

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

// When player 1 quits the game, remove them from the database.
$(document).on("click", "#quit1", function () {
    database.ref('users/1').remove();
});

// When player 2 quits the game, remove them from the database.
$(document).on("click", "#quit2", function () {
    database.ref('users/2').remove();
});

// When a player quits the game, the board should be reset and a new player 
// should be able to enter the game.
database.ref('users').on("child_removed", function (snapshot) {
    var playerRemoved = snapshot.val();

    if (playerRemoved.playernumber === 1) {
        player1Content.empty();
        $("#player1-name").val("");
        $("#player1-name").attr("readonly", false);
        player1Button.removeClass("d-none");
        player1Wins.text("");
        player1Losses.text("");
        $("#quit1").remove();
    } else {
        player2Content.empty();
        $("#player2-name").val("");
        $("#player2-name").attr("readonly", false);
        player2Button.removeClass("d-none");
        player2Wins.text("");
        player2Losses.text("");
        $("#quit2").remove();
    }
});

// When a new player is added to the database, lock in their name and add the rock, paper,
// scissors, and quit button options to the screen.
database.ref('users').on("child_added", function (snapshot) {
    var player = snapshot.val();
    sessionID = sessionStorage.getItem("sessionID");

    if (player.playernumber === 1) {
        $("#player1-name").val(player.playername);
        $("#player1-name").attr("readonly", true);
        player1Button.addClass("d-none");
        if (sessionID === player.playersessionID) {
            addRPSButtons(1);
            var quitButton = $("<button class='btn-danger " + buttonBSClasses + "' id='quit1'>Quit Game</button>");
            player1Div.append(quitButton);
        }
    } else {
        $("#player2-name").val(player.playername);
        $("#player2-name").attr("readonly", true);
        player2Button.addClass("d-none");
        if (sessionID === player.playersessionID) {
            addRPSButtons(2);
            var quitButton = $("<button class='btn-danger " + buttonBSClasses + "' id='quit2'>Quit Game</button>");
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

    // First make sure that we have users in the database, and that we have both a 
    // player 1 and a player 2.
    if (users !== null && users[1] !== undefined && users[2] !== undefined) {

        // Retrieve the players choices.
        var player1Choice = users[1].playerchoice;
        var player2Choice = users[2].playerchoice;

        // Make sure that both players have made a choice.
        if (player1Choice !== "none" && player2Choice !== "none") {

            // Display the players choices.
            displayChoices(player1Choice, player2Choice);

            // Compare the choices and determine who won the round.
            if (player1Choice === player2Choice) {
                deckDiv.append("<h4>It was a tie!</h4>");
                resetGameBoard();
            } else {
                var didPlayer1Win = checkWinCondition(player1Choice, player2Choice);
                if (didPlayer1Win) {
                    deckDiv.append("<h4>Player 1 won!</h4>");
                    modifyRecords("1","2");
                } else {
                    deckDiv.append("<h4>Player 2 won!</h4>");
                    modifyRecords("2","1");
                }
            }

            // After a round, clear their choices from the database.
            clearChoices();
        }
    }
    // Handle the errors
}, function (errorObject) {
    console.log("Errors handled: " + errorObject.code);
});

// Display the player choices as images and text.
function displayChoices(player1, player2) {
    deckDiv.empty();
    player1Image.empty();
    player2Image.empty();

    if (player1 === "rock") {
        player1Image.append(rockImage);
    } else if (player1 === "scissors") {
        player1Image.append(scissorsImage);
    } else {
        player1Image.append(paperImage);
    }

    if (player2 === "rock") {
        player2Image.append(rockImage);
    } else if (player2 === "scissors") {
        player2Image.append(scissorsImage);
    } else {
        player2Image.append(paperImage);
    }

    deckDiv.append("<h4>Player 1 chose: " + player1 + "</h4>");
    deckDiv.append("<h4>Player 2 chose: " + player2 + "</h4>");
}

// Check to see who won the round.
function checkWinCondition(player1, player2) {
    if ((player1 === "rock" && player2 === "scissors") || (player1 === "scissors" && player2 === "paper") || (player1 === "paper" && player2 === "rock")) {
        return true;
    } else {
        return false;
    }
}

// Update the wins and losses of the players.
function modifyRecords(winningPlayer, losingPlayer) {
    $.get('https://click-counter-72785.firebaseio.com/.json')
        .then(function (response) {
            var wins = response.users[winningPlayer].playerwins;
            wins++;
            database.ref('users/' + winningPlayer + '/playerwins').set(wins);
            var losses = response.users[losingPlayer].playerlosses;
            losses++;
            database.ref('users/' + losingPlayer + '/playerlosses').set(losses);
            resetGameBoard();
        });
}

// Clear the player choices so they can play again.
function clearChoices() {
    database.ref('users/1/playerchoice').set("none");
    database.ref('users/2/playerchoice').set("none");
}

// Empty the player notifications and reset the option buttons.
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

            player1Wins.text(response.users[1].playerwins);
            player1Losses.text(response.users[1].playerlosses);
            player2Wins.text(response.users[2].playerwins);
            player2Losses.text(response.users[2].playerlosses);
        });
}