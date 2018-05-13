// Stores the server endpoints this app needs. If the server address changes these variables need changing as well.
var sendLocationEndpoint = "http://developer.cege.ucl.ac.uk:30278/getQuestionForLocation";
var saveAnswerEndpoint = "http://developer.cege.ucl.ac.uk:30278/saveAnswer";

// Getting phone id using cordova plugin
// Sources:
// http://docs.phonegap.com/en/3.0.0/cordova_device_device.md.html#device.uuid
// https://stackoverflow.com/questions/34859217/cordova-device-plugin-not-working
function getPhoneId() {
    // Just a guard in case the cordova plugin is not ready with the 'device' global object.
    if (!("device" in window)) {
        return 'unknown';
    }
    return device.uuid;
}

// Will store the current question as a global variable as it's access in many functions below.
var currentQuestion;

// Calls the server with the user position and phone id and expects to receive 0 or 1 questions
function getQuestion(position) {

    // Getting lat and long. Coordinate system is WGS84
    // Source: https://www.w3.org/TR/geolocation-API/
    var lat = position.coords.latitude;
    var long = position.coords.longitude;

    console.log('got location: ', lat, long);

    // Creating new serve request, it will be a POST as we need to send data.
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
    client = new XMLHttpRequest();
    client.open('POST', sendLocationEndpoint, true);

    // Tells the server we are sending JSON in the request body
    client.setRequestHeader("Content-type", "application/json");

    // Data to be sent to server.
    var body = {
        lat,
        long,
        phoneId: getPhoneId(),
    };

    // Doing some logic on server response
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/onreadystatechange
    client.onreadystatechange = function () {
        // Ensures the request is done and was successful
        if (client.readyState === 4 && client.status === 200) {
            // Parses the server response to an object
            var response = JSON.parse(client.responseText);

            // Saves the response to a global object so it can be acessed elsewhere.
            currentQuestion = response;

            // If there are no questions returned by server, we show a message
            if (!response.question) {
                // Show that there are no questions to show
                // Source: https://www.w3schools.com/howto/howto_js_add_class.asp
                document.getElementById("no-question").classList.add('show');

                // Will trigger another question fetch
                done();
            } else {

                // Hide 'There are no questions for this location' message
                document.getElementById("no-question").classList.remove('show');

                // Setting question and answers text
                // Source: https://stackoverflow.com/questions/4488714/change-label-text-using-javascript
                document.getElementById("question").innerHTML = response.question;
                document.getElementById("option1").innerHTML = response.answer1;
                document.getElementById("option2").innerHTML = response.answer2;
                document.getElementById("option3").innerHTML = response.answer3;
                document.getElementById("option4").innerHTML = response.answer4;

                // Shows question container
                document.getElementById("question-container").classList.add('show');
            }
        }
    };
    // Sends the data to the server
    client.send(JSON.stringify(body));
}

function submitAnswer() {
    // Getting radio button value
    // Source: https://stackoverflow.com/questions/9618504/how-to-get-the-selected-radio-button-s-value
    // Note: the user might not have chosen any option. We don't do anything in this case.
    var checkedOptionElement = document.querySelector('input[name="chosenOption"]:checked');
    if (!checkedOptionElement) {
        return;
    }

    // Stores the chosen option as string ('1', '2', '3' or '4')
    var chosenOption = checkedOptionElement.value;

    console.log('chosen option: ', chosenOption, ', correctOption:', currentQuestion.correct_answer);

    // Disabling each radio button as we will show the answer
    var radios = document.getElementsByName('chosenOption');
    for (var i = 0; i < radios.length; i++) {
        radios[i].disabled = true;
    }

    // Disabling submit button as we will show the answer
    document.getElementById("submitButton").disabled = true;

    // Showing which answers were correct or wrong
    document.getElementById("option1").innerHTML = currentQuestion.answer1 + " (Wrong)";
    document.getElementById("option2").innerHTML = currentQuestion.answer2 + " (Wrong)";
    document.getElementById("option3").innerHTML = currentQuestion.answer3 + " (Wrong)";
    document.getElementById("option4").innerHTML = currentQuestion.answer4 + " (Wrong)";

    // Coloring all wrong elements in red
    document.getElementById("option1").classList.add('wrong');
    document.getElementById("option2").classList.add('wrong');
    document.getElementById("option3").classList.add('wrong');
    document.getElementById("option4").classList.add('wrong');

    // Showing the correct answer as right and colouring it as green
    document.getElementById("option" + currentQuestion.correct_answer).innerHTML = currentQuestion["answer" + currentQuestion.correct_answer] + " (Right)";
    document.getElementById("option" + currentQuestion.correct_answer).classList.remove('wrong')
    document.getElementById("option" + currentQuestion.correct_answer).classList.add('right');

    // Showing final message container (see below)
    document.getElementById("final-message").classList.add('show');

    // Showing final message ('You chose the correct answer' or 'You chose the wrong answer' message)
    if (currentQuestion.correct_answer === chosenOption) {
        document.getElementById("message").innerHTML = "You chose the correct answer";
        console.log('User chose the correct option');
    } else {
        document.getElementById("message").innerHTML = "You chose the wrong answer";
        console.log('user chose the wrong option');
    }

    // Creating a new POST request to the serve as data will be sent
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
    client = new XMLHttpRequest();
    client.open('POST', saveAnswerEndpoint, true);

    // Tells the server we are sending JSON in the request body
    client.setRequestHeader("Content-type", "application/json");

    // Sending the selected answer to the server
    client.send(JSON.stringify({
        phoneId: getPhoneId(),
        questionId: currentQuestion.id,
        answer: chosenOption,
    }));
}

// Clears the HTML from changes styles and triggers the fetching of a new question
function done() {
    // Undoing all document manipulations we may have done so we start the next question from scratch
    document.getElementById("question-container").classList.remove('show');
    document.getElementById("final-message").classList.remove('show');
    document.getElementById("option1").classList = [];
    document.getElementById("option2").classList = [];
    document.getElementById("option3").classList = [];
    document.getElementById("option4").classList = [];
    document.getElementById("final-message").classList = [];

    // Re-enabling radio buttons
    var radios = document.getElementsByName('chosenOption');
    for (var i = 0; i < radios.length; i++) {
        radios[i].disabled = false;
        radios[i].checked = false;
    }

    // Re-enabling submit button
    document.getElementById("submitButton").disabled = false;

    console.log('done');

    // Starts all over again, sending position to server
    // after a number of seconds
    setTimeout(sendPositionToServer, 2000);
}

// Stores the current position as a global variable to be used elsewhere
var currentPosition;

// Watching user position. Every time the position changes we save to the 'currentPosition' global variable
// Source: https://developers.google.com/web/fundamentals/native-hardware/user-location/
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/Using_geolocation
// navigator.geolocation.watchPosition(function(position){
//     currentPosition = position;
// });

setInterval(function() {
    navigator.geolocation.getCurrentPosition(function(position) {
        currentPosition = position
    }, function() {}, { enableHighAccuracy: true, maximumAge: 0 });
}, 1000)

// Sends the current position to the server in hopes of getting a question
function sendPositionToServer() {
    // If we dont have a current position yet, call done(), which will try again in a number of seconds
    if (!currentPosition) {
        done();
        return;
    }

    // If we have position, see if the server has a question for us
    getQuestion(currentPosition);
}

// Initiates sending position to server.
sendPositionToServer();