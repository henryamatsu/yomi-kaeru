# Views
- homepage
    - blurb explaining product
    - translation demo (read more below)
    - account creation
    - download button
- login/signup
- Account page
    - wordset preferences
    - replacement frequency
    - learning progress
        - grid with characters in a given tier, color coded to indicate mastery
    - personalized translation demo

## Database
    - Wordbank 
        - create different wordbank tiers (can start with just first tier)
    - Users
        - track setting preferences
        - track learning progress

## Translation demo
    - paste text, converts to html
    - scan html for eligible words to translate
    - SANITIZE HTML with library
    - hover over word for popup window. Mark as remembered or forgotten, see translation, get more info
    - tabbing functionality? We have to better understand how users might normally use tab so we don't create conflicts with default behavior

# Chrome Extension
    - popup window to adjust preferences
    - finds convertable text on the page and converts to hoverable translated spans with same features as translation demo

# aspirational features (might require AI)
    - translating verbs (complicated, because of conjugation)
    - handling homographs
    - whole sentences