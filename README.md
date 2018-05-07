# Location Quiz app

This app will show questions to the user that are relevant to their current geographic position.
The user can choose an option and will be told if they choose the correct answer or not

It depends on a service running in the backend, you can get it by going to https://github.com/patrickstsouza/server.

# Installation

This is a phone app. You can download the app from https://build.phonegap.com/apps/3151935/builds and install on your android.
This version points to the default server (http://developer.cege.ucl.ac.uk:30278/) so make sure it is running.

# Installation for development

You can download this repository if you want to change the source code to point to a different server, for instance.

1. Clone this repository and cd into the directory:
```
git clone https://github.com/patrickstsouza/quiz
cd quiz
```

2. Make your code changes and submit to github
```
git push origin {branch-name}
```

3. Create a new app in PhoneGap and install it.

Go to https://build.phonegap.com/apps and login. If you don't have an account, create one.
Create a new app and give it the current repository address (https://github.com/patrickstsouza/quiz) and the branch name you pushed to.
Wait for the build to complete. Once this happens you can download the APK on your android and install it

# Changing the server address

If you need the app to point to another server you have to change the 'quiz.js' source file.
Open it and change the 'sendLocationEndpoint' and 'saveAnswerEndpoint' variables to point to the correct server.
Push to master and rebuild it in PhoneGap