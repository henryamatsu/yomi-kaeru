class Translator {
    constructor() {
      this.preferences = window.preferences;

      this.textType = "input";

      // this will store data for every translated word
      this.translationReference = [];
      this.currentWordElement = null;
  
      this.setupQuerySelectors();
      this.setupEventListeners();

      (async () => {
        await this.createTranslationSets();
      })();
    }
  
    setupQuerySelectors() {
      this.preferenceControls = document.querySelector(".preference-controls");
      this.saveButton = document.querySelector("#save-button");
      this.sampleTextButton = document.querySelector("#sample-text-button");
      this.translateButton = document.querySelector("#translate-button");
      this.textDisplay = document.querySelector(".text-display");
      this.textInput = document.querySelector(".text-input");
      this.infoPopup = document.querySelector("#info-popup");
      this.loadingScreen = document.querySelector("#loading-screen");
    }
  
    setupEventListeners() {
      this.preferenceControls.addEventListener("click", this.handlePrefenceInput.bind(this));
      this.saveButton.addEventListener("click", this.handleSaveButton.bind(this));
      this.sampleTextButton.addEventListener("click", this.handleSampleTextButton.bind(this));
      this.translateButton.addEventListener("click", this.handleTranslateButton.bind(this));
  
      document.addEventListener("mouseover", this.displayHoverInfo.bind(this));
      document.addEventListener("mouseout", this.hideHoverInfo.bind(this));
      document.addEventListener("click", this.changeReading.bind(this));
    }

    async createTranslationSets() {
      const grades = this.preferences.grades;
      const newEligibleSet = new Set();
      const newKanjiSet = new Set();

      if (grades.grade1) {
        const eligibleRes = await fetch("/json/eligible1.json");
        const eligibleData = await eligibleRes.json();

        const kanjiRes = await fetch("/json/kanji1.json");
        const kanjiData = await kanjiRes.json();  

        eligibleData.forEach(e => newEligibleSet.add(e));
        kanjiData.forEach(e => newKanjiSet.add(e));
      }
      if (grades.grade2) {
        const eligibleRes = await fetch("/json/eligible2.json");
        const eligibleData = await eligibleRes.json();

        const kanjiRes = await fetch("/json/kanji2.json");
        const kanjiData = await kanjiRes.json();  

        eligibleData.forEach(e => newEligibleSet.add(e));
        kanjiData.forEach(e => newKanjiSet.add(e));
      }
      if (grades.grade3) {
        const eligibleRes = await fetch("/json/eligible3.json");
        const eligibleData = await eligibleRes.json();

        const kanjiRes = await fetch("/json/kanji3.json");
        const kanjiData = await kanjiRes.json();  

        eligibleData.forEach(e => newEligibleSet.add(e));
        kanjiData.forEach(e => newKanjiSet.add(e));
      }
      
      this.eligibleSet = newEligibleSet;
      this.kanjiSet = newKanjiSet;
    }
  
    handlePrefenceInput(event) {
      let value = event.target.value;
      if (value === undefined || value === "") return;

      value = value === "true" ? true : value === "false" ? false : value;
      const checked = event.target.checked;
      const id = event.target.id;

      switch (id) {
        case "grade-1":
          this.preferences.grades.grade1 = checked; 
          break;
        case "grade-2":
          this.preferences.grades.grade2 = checked; 
          break;
        case "grade-3":
          this.preferences.grades.grade3 = checked; 
          break;
        case "japanese":
        case "english":
        case "romaji":
          this.preferences.defaultLanguage = value; 
          break;
        case "frequency":
          this.preferences.frequency = value;
          break;
      }  
    }

    async handleSaveButton() {
      this.createTranslationSets();

      fetch("/preferences", {
        method: "put",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(this.preferences)
      });
    }

    async handleSampleTextButton() {
      const res = await fetch("/json/sample-text.json");
      const data = await res.json();

      this.textInput.value = data.text;
    }
  
    handleTranslateButton() {
      if (this.textType === "input") {
        this.convertInputText();
      }
      else if (this.textType === "display") {
        this.returnToInput();
      }
    }
  
    async convertInputText() {
      this.textType = "display";
      
      this.translateButton.innerText = "New Translation";
      this.textDisplay.style = "display: block;"
      this.textInput.style = "display: none;"
      this.sampleTextButton.style = "display: none;"
  
      this.textDisplay.innerText = this.textInput.value; // we don't have to purify here since we're using innerText
  
      this.toggleLoadingScreenVisibility(true);
      this.textDisplay.innerHTML = await this.translateEligibleWords();
      this.toggleLoadingScreenVisibility(false);
    }

    // translate v2
    async translateEligibleWords() {
      await this.createTranslationSets();

      const text = this.textDisplay.innerText;
      const purifiedText = DOMPurify.sanitize(text);

      const sentencesArr = this.createSentencesArr(purifiedText);
      const sentenceWordsArr = this.createSentenceWordsArr(sentencesArr);
    
      const geminiInput = this.createGeminiInput(sentencesArr, sentenceWordsArr);

      if (geminiInput.length === 0) {
        return "<h2>Nothing to translate!</h2>";
      }

      const startTime = new Date();
      console.log("gemini starting...");

      const geminiRes = await fetch("/translation?_method=GET", {
        method: "post",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(geminiInput)
      });

      const endTime = new Date();
      console.log(`gemini finished after: ${(endTime - startTime)/ 1000} seconds`);

      const geminiOutput = await geminiRes.json();
      const filteredGeminiOutput = this.filterGeminiOutput(geminiOutput);
  
      if (filteredGeminiOutput.length === 0) {
        return "<h2>Nothing to translate!</h2>";
      } 

      const newSentenceWordsArr = this.swapInTranslatedSentences(sentenceWordsArr, filteredGeminiOutput);
      const newSentencesArr = newSentenceWordsArr.map(arr => arr.join(""));
      const newText = newSentencesArr.join("");
      
      return newText;
    }

    createSentencesArr(text) {
      // split the text element into sentences based on punctuation marks
      let sentencesArr = text.split(/([.!?]+)/);

      // reattach the punctuation marks
      sentencesArr = sentencesArr.reduce((acc, e, i) => {
        if (i % 2 == 0) {
          return [...acc, e]
        }
        else {
          acc[acc.length - 1] += e;
          return acc;
        }
      }, []);

      return sentencesArr;
    }

    createSentenceWordsArr(sentencesArr) {
      const sentenceWordsArr = sentencesArr.map(sentence => {
        // split each sentence into words
        return sentence.split(/([^a-zA-Z\d]+)/);
      });

      return sentenceWordsArr;
    }

    createGeminiInput(sentencesArr, sentenceWordsArr) {
      // this array will store the data that we send to gemini
      let inputArr = [];

      sentenceWordsArr.forEach((wordsArr, sentenceIndex) => {
        // store all eligible words
        const eligibleWords = [];

        wordsArr.forEach((word, wordIndex) => {
          // roll to see if we're going to attempt to replace this word
          const replacementChance = Math.round(Math.random() * 100) < +this.preferences.frequency;

          // if the word is in the set and we rolled under the replacement threshold, we'll add it to the eligibleWords array
          if (this.eligibleSet.has(word) && replacementChance) {
            eligibleWords.push({
              word,
              wordIndex // this is so we can easily access the location of the translated word within the sentence
            });
          }
        });

        // we build an object with data that gemini will need to make the translation
        const inputData = {
          eligibleWords,
          sentence: sentencesArr[sentenceIndex],
          sentenceIndex // this is so we can find and replace the original sentence after translation
        } 

        inputArr.push(inputData);
      });

      // remove entries for sentences with 0 translation-eligible words
      inputArr = inputArr.filter(e => e.eligibleWords.length > 0);

      // limit size for testing
      // inputArr = inputArr.slice(0, 5);

      return inputArr;
    }

    filterGeminiOutput(geminiOutput) {
      // go through the words array of each entry 
      geminiOutput = geminiOutput.map(entry => {
        const words = entry.words = entry.words.filter(word => {
          const jpArr = word.japanese.split("");

          // remove the word if none of its chars are within the kanjiSet
          return jpArr.some(char => this.kanjiSet.has(char));
        });

        return {
          ...entry,
          words
        }
      });
      
      return geminiOutput.filter(entry => entry.words.length > 0);
    }

    swapInTranslatedSentences(sentenceWordsArr, filteredGeminiOutput) {      
      this.translationReference = [];

      filteredGeminiOutput.forEach(entry => {
        const currentArr = sentenceWordsArr[entry.sentenceIndex];

        entry.words.forEach(word => {
          currentArr[word.wordIndex] = `<span class="translated-word" data-index=${this.translationReference.length} data-language=${this.preferences.defaultLanguage}>${word[this.preferences.defaultLanguage]}</span>`;
          this.translationReference.push({
            japanese: word.japanese,
            english: word.english,
            romaji: word.romaji
          });
        });
      });

      return sentenceWordsArr;
    }

    returnToInput() {
      this.textType = "input";
  
      this.translateButton.innerText = "Translate!";
      this.textDisplay.style = "display: none;"
      this.textInput.style = "display: block;"
      this.sampleTextButton.style = "display: inline-block;"
    }
  
    displayHoverInfo(event) {
      if (!event.target.classList.contains("translated-word")) return;
    
      this.currentWordElement = event.target;
      this.populateHoverInfo(event);

      const clientHeight = document.documentElement.clientHeight;
      const midPoint = clientHeight / 2;

      const pointerX = event.clientX;
      const pointerY = event.clientY;
      
      if (pointerY < midPoint) {
        this.infoPopup.classList.add("below-midpoint");
        this.infoPopup.classList.remove("above-midpoint");
      }
      else {
        this.infoPopup.classList.add("above-midpoint");
        this.infoPopup.classList.remove("below-midpoint");
      }
      
      const popupWidth = this.infoPopup.offsetWidth;
      const popupHeight = this.infoPopup.offsetHeight;
      
      const yAdjust = pointerY < midPoint ? -20 : -popupHeight + 20;

      const popupX = pointerX - popupWidth / 2;
      const popupY = pointerY + yAdjust;

      this.infoPopup.style.visibility = "visible";
      this.infoPopup.style.left = popupX + "px";
      this.infoPopup.style.top = popupY + "px";
    }
  
    populateHoverInfo(event) {
      const entry = this.translationReference[event.target.dataset.index];

      this.infoPopup.querySelector("#japanese-reading").innerText = entry.japanese;
      this.infoPopup.querySelector("#english-reading").innerText = entry.english;
      this.infoPopup.querySelector("#romaji-reading").innerText = entry.romaji;

      this.toggleLanguageVisibility(event);
    }
  
    hideHoverInfo(event) {
      if (!event.target.classList.contains("translated-word")) return;
  
      this.currentWordElement = null;
      this.infoPopup.style.visibility = "hidden";
    }
  
    changeReading(event) {
      if (!event.target.classList.contains("translated-word")) return;
      const index = event.target.dataset.index;
      let language = event.target.dataset.language;
  
      language =
      language === "japanese" ? "english" :
      language === "english" ? "romaji" : "japanese";
      
      event.target.dataset.language = language;
      event.target.innerText = this.translationReference[index][language];
      this.toggleLanguageVisibility(event);
    }

    toggleLanguageVisibility(event) {
      const language = event.target.dataset.language;
      this.infoPopup.querySelector("#japanese-reading").parentNode.style.display = language === "japanese" ? "none" : "unset";
      this.infoPopup.querySelector("#english-reading").parentNode.style.display = language === "english" ? "none" : "unset";
      this.infoPopup.querySelector("#romaji-reading").parentNode.style.display = language === "romaji" ? "none" : "unset";
    }
    
    toggleLoadingScreenVisibility(isLoading) {
      if (isLoading) {
        this.loadingScreen.classList.add("visible");
      }
      else {
        this.loadingScreen.classList.remove("visible");
      }
    }
  }
  
const translator = new Translator();

let ref = translator.translationReference;