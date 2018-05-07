var sendLocationEndpoint = "http://developer.cege.ucl.ac.uk:30278/getQuestionForLocation";
var saveAnswerEndpoint = "http://developer.cege.ucl.ac.uk:30278/saveAnswer";

// Getting phone id using cordova plugin
// Sources:
// http://docs.phonegap.com/en/3.0.0/cordova_device_device.md.html#device.uuid
// https://stackoverflow.com/questions/34859217/cordova-device-plugin-not-working
function getPhoneId() {
    if (!("device" in window)) {
        return 'foo';
    }
    return device.uuid;
}

var currentQuestion;

function getQuestion(position) {

    // Getting lat and long. Coordinate system is WGS84
    // Source: https://www.w3.org/TR/geolocation-API/
    var lat = position.coords.latitude;
    var long = position.coords.longitude;

    console.log('got location: ', lat, long);

    client = new XMLHttpRequest();
    client.open('POST', sendLocationEndpoint, true);

    // Tells the server we are sending JSON in the request body
    client.setRequestHeader("Content-type", "application/json");

    var body = {
        lat,
        long,
        phoneId: getPhoneId(),
    };

    // Doing some logic on server response
    // Source: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/onreadystatechange
    client.onreadystatechange = function () {
        if (client.readyState === 4 && client.status === 200) {
            var response = JSON.parse(client.responseText);
            currentQuestion = response;

            console.log('response from server: ', response);

            if (!response.question) {
                // Show that there are no questions to show
                // Source: https://www.w3schools.com/howto/howto_js_add_class.asp
                document.getElementById("no-question").classList.add('show');
                done();
                return;
            }

            document.getElementById("no-question").classList.remove('show');

            // Setting question and answers text
            // Source: https://stackoverflow.com/questions/4488714/change-label-text-using-javascript
            document.getElementById("question").innerHTML = response.question;
            document.getElementById("option1").innerHTML = response.answer1;
            document.getElementById("option2").innerHTML = response.answer2;
            document.getElementById("option3").innerHTML = response.answer3;
            document.getElementById("option4").innerHTML = response.answer4;

            document.getElementById("question-container").classList.add('show');
        }
    };
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

    var chosenOption = checkedOptionElement.value;

    console.log('chosen option: ', chosenOption, ', correctOption:', currentQuestion.correct_answer);

    // Disabling radio buttons
    var radios = document.getElementsByName('chosenOption');
    for (var i = 0; i < radios.length; i++) {
        radios[i].disabled = true;
    }

    // Disabling submit button
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

    document.getElementById("final-message").classList.add('show');

    if (currentQuestion.correct_answer === chosenOption) {
        document.getElementById("message").innerHTML = "You chose the correct answer";
        console.log('User chose the correct option');
    } else {
        document.getElementById("message").innerHTML = "You chose the wrong answer";
        console.log('user chose the wrong option');
    }

    // Sending the selected answer to the serve
    client = new XMLHttpRequest();
    client.open('POST', saveAnswerEndpoint, true);

    // Tells the server we are sending JSON in the request body
    client.setRequestHeader("Content-type", "application/json");
    client.send(JSON.stringify({
        phoneId: getPhoneId(),
        questionId: currentQuestion.id,
        answer: chosenOption,
    }));
}

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

var currentPosition;

// Watching user position
// Source: https://developers.google.com/web/fundamentals/native-hardware/user-location/
navigator.geolocation.watchPosition(function(position){
    currentPosition = position;
});

// Getting user position
// Source: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/Using_geolocation
function sendPositionToServer() {
    // If we dont have a current position yet, call done(), which will try again in a number of seconds
    if (!currentPosition) {
        done();
        return;
    }

    // If we have position, see if the server has a question for us
    getQuestion(currentPosition);
}

document.addEventListener("deviceready", function(e) {
    console.log('>> device ready: ', e);
    console.log('>>> device: ', device);
}, false);

sendPositionToServer();