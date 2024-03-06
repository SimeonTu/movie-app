# Server-side for IFDb

IFDb is a web app for movie enthusiasts who want to access and save information about their favorite movies.

## Overview

The goal of this project is to build the back end component of the IFDb web app using Node.js, Exress, and MongoDB as part of the MERN/MEAN stack, showcasing skills in APIs, web server frameworks, databases, business logic, authentication, data security and more. The server provides a REST API that allows for user registration, login, modifying user account details / deleting account, accessing information about movie/s, genres and directors, as well as adding and removing movies to and from the user account. All of the data is stored securely in the NoSQL database MongoDB.

The full documentation of the API can be found [here](https://ifdbase-c6a1086fce3e.herokuapp.com/api-docs/)

![Documentation home page](https://i.imgur.com/plYO6vY.png)

## API Features
- Get a list of ALL movies to the user
- Get data (title, synopsis, genre, director, image URL, release year, rating, whether it’s featured or not) about a
single movie by title to the user
- Get data about a genre (description) by name/title (e.g., “Thriller”)
- Get data about a director (bio, birth year, death year) by name
- Allow new users to register
- Allow users to update their user info (username, password, email, date of birth)
- Allow users to add a movie to their list of favorites
- Allow users to remove a movie from their list of favorites
- Allow existing users to deregister

## Getting Started
1. Install dependencies: ```npm install```

2. Start the server: ```npm start``` or for development with nodemon: ```npm run dev```

## Technologies Used
- Node.js
- Express.js
- MongoDB with Mongoose
- Passport.js for user authentication
- Swagger for generating documentation
