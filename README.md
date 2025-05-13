# Yomi-kaeru: A Language Learning App

Yomi-kaeru is an app and browser extension that can scan through text on a webpage and periodically translate words into Japanese. The idea is to give the user passive exposure to the language they're trying to learn by peppering translated words throughout their everyday internet use.

![yomi-kaeru-landing-page](https://github.com/user-attachments/assets/5390afc0-1c12-4b29-9b70-5a09cf543b56)

![yomi-kaeru-profile-page](https://github.com/user-attachments/assets/824e8b4b-e34e-43d0-a78c-f9f7654216cd)

*Screenshots of the landing page and user profile page*

## How It’s Made

**Tech Stack:**  
- **Backend:** Node.js, Express.js, Passport.js (user authentication)
- **Database:** MongoDB, Mongoose
- **Frontend:** EJS, HTML, CSS, JS
- **APIs:** Gemini AI API

## How It Works
- On a user's profile page they can adjust settings such as what grades of kanji they'd like to practice
- The profile page has a demo window where the user can insert text to test the translation feature with their current settings
- The accompanying chrome extension can be installed to leverage the translation feature across the web

## Installation

1. Clone repo
2. run `npm install`
3. get a key at https://aistudio.google.com/app/apikey

## Usage

1. run `node server.js`
2. Create a `.env` file in config folder and add the following:
  - PORT = 8080 (can be any port example: 3000)
  - DB_STRING = `your database URI`
  - API_KEY = `your gemini api key`
3. Navigate to `localhost:{insert your PORT number here}`
4. Create an account
