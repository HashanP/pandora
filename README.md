pandora
=======

![Screenshot](public/screenshot.png)

The world's most advanced V.L.E. - Version 2.0

Hashan Punchihewa - Programmer
Joseph Bills - Tester
Oliver Croysdill - Icons

Features
---
- Flexible Content Editor
 - Rich Text
 - LaTeX
 - Images
 - YouTube
- Quizzes
 - Multiple Answers
 - Multiple Choice 
 - Radio buttons
 - Checkboxes
 - Performance Graphs
 - Vocabulary Quizzes
- Student Pane
 - Email Students 
 - Random Name Generator 
 
Deployment
-------

From my experience Heroku is the easiest platform to deploy to. Its standard plan is free and includes a free 500MB database. There is no need to set anything up. If you want to locally deploy it, you will either need to run a local MongoDB database (see [here](http://docs.mongodb.org/manual/installation/)) or you will need to setup it up with MongoLab.

---
### 1-Click Deployment with Heroku

<img src="http://blog.exadel.com/wp-content/uploads/2013/10/heroku-Logo-1.jpg" width="200">

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/TheMuses/pandora)

Simply by clicking the button above, you will be able to setup a live server on the web, including the database. An admin user is automatically created, with a username and password of "Admin".

---
<img src="http://i.imgur.com/7KnCa5a.png" width="200">
- Open [mongolab.com](https://mongolab.com) website
- Click the yellow **Sign up** button
- Fill in your user information then hit **Create account**
- From the dashboard, click on **:zap:Create new** button
- Select **any** cloud provider (I usually go with AWS)
- Under *Plan* click on **Single-node (development)** tab and select **Sandbox** (it's free)
 - *Leave MongoDB version as is - `2.4.x`*
- Enter *Database name** for your web app
- Then click on **:zap:Create new MongoDB deployment** button
- Now, to access your database you need to create a DB user
- Click to the recently created database
- You should see the following message:
 - *A database user is required to connect to this database.* **Click here** *to create a new one.*
- Click the link and fill in **DB Username** and **DB Password** fields
- Finally, in `config/secrets.js` instead of `db: 'localhost'`, use the following URI with your credentials:
 - `db: "mongodb://USERNAME:PASSWORD@ds027479.mongolab.com:27479/DATABASE_NAME"`

> **:exclamation:Note:** As an alternative to MongoLab, there is also [MongoHQ](http://www.mongohq.com/home).

---
### Local Deployment
- Clone this repository: `git clone https://github.com/TheMuses/pandora`
- Go into new folder
- Install dependencies: `npm install`
- Start server: `npm start`
