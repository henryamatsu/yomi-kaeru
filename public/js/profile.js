class Translator {
    constructor() {
      this.preferences = window.preferences;

      this.textType = "input";
      this.currentWordElement = null;

      // this will store data for every translated word
      this.translationReference = [];
  
      this.setupQuerySelectors();
      this.setupEventListeners();

      this.createTranslationSets();
    }
  
    setupQuerySelectors() {
      this.preferenceControls = document.querySelector(".preference-controls");
      this.saveButton = document.querySelector("#save-button");
      this.sampleTextButton = document.querySelector("#sample-text-button");
      this.translateButton = document.querySelector("#translate-button");
      this.textDisplay = document.querySelector(".text-display");
      this.textInput = document.querySelector(".text-input");
      this.infoPopup = document.querySelector("#info-popup");
    }
  
    setupEventListeners() {
      this.preferenceControls.addEventListener("click", this.handlePrefenceInput.bind(this));
      this.saveButton.addEventListener("click", this.handleSaveButton.bind(this));
      this.sampleTextButton.addEventListener("click", this.handleSampleTextButton.bind(this));
      this.translateButton.addEventListener("click", this.handleTranslateButton.bind(this));
  
      document.addEventListener("mouseover", this.displayHoverInfo.bind(this));
      this.infoPopup.addEventListener("mouseout", this.hideHoverInfo.bind(this));
      this.infoPopup.addEventListener("click", this.changeReading.bind(this));
      
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

      const id = event.target.id;

      switch (id) {
        case "grade-1":
          this.preferences.grades.grade1 = value; 
          break;
        case "grade-2":
          this.preferences.grades.grade2 = value; 
          break;
        case "grade-3":
          this.preferences.grades.grade3 = value; 
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

      this.textInput.innerText = data.text;
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
  
      this.textDisplay.innerText = this.textInput.value;
  
      this.textDisplay.innerHTML = await this.translateEligibleWords();
    }

    // translate v2
    async translateEligibleWords() {
      // in theory, this design should be pretty easy to port over to translating multiple text elements
      // maybe for multiple elements, this method will be called for each individual method? Or
      // we should amass the text so we can make one call to gemini api
      const text = this.textDisplay.innerText;

      const sentencesArr = this.createSentencesArr(text);
      const sentenceWordsArr = this.createSentenceWordsArr(sentencesArr);
    
      const geminiInput = this.createGeminiInput(sentencesArr, sentenceWordsArr);

      // console.log(JSON.stringify(geminiInput));
  
      const geminiRes = await fetch("/translation?_method=GET", {
        method: "post",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(geminiInput)
      });

      const geminiOutput = await geminiRes.json();

      // checking to see if filtering is working
      // console.log("unfiltered");
      // console.log(geminiOutput);
      // console.log("unfiltered length: ", geminiOutput.length);

      const filteredGeminiOutput = this.filterGeminiOutput(geminiOutput);

      // console.log("filtered");
      // console.log(filteredGeminiOutput);
      // console.log("filtered length: ", filteredGeminiOutput.length);


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
      filteredGeminiOutput.forEach(entry => {
        const currentArr = sentenceWordsArr[entry.sentenceIndex];

        entry.words.forEach(word => {
          currentArr[word.wordIndex] = `<span class="translated-word" data-index=${this.translationReference.length}>${word.japanese}</span>`;
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
  
      const pointerX = event.clientX;
      const pointerY = event.clientY;
      const popupWidth = this.infoPopup.offsetWidth;
      const popupHeight = this.infoPopup.offsetHeight;
   
      const clientHeight = document.documentElement.clientHeight;
      const midPoint = clientHeight / 2;
      const yAdjust = pointerY < midPoint ? -20 : -popupHeight + 20;
  
      if (pointerY < midPoint) {
        this.infoPopup.style.paddingTop = "40px";
        this.infoPopup.style.paddingBottom = "0";
      }
      else {
        this.infoPopup.style.paddingTop = "0";
        this.infoPopup.style.paddingBottom = "40px";
      }
  
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
    }
  
    hideHoverInfo(event) {
      // if (event.relatedTarget.classList.contains("popup-content")) return;
      this.currentWordElement = null;
      this.infoPopup.style.visibility = "hidden";
    }
  
    changeReading() {
      // on clicking a translated word, this feature will change the reading to hiragana/romaji
    }
  }
  
const translator = new Translator();

let ref = translator.translationReference;

// Here is some sample text to demonstrate the translation feature. If you hover over a translated <span class="translated-word" data-index="0">単語</span>, you can <span class="translated-word" data-index="1">見る</span> additional info about the <span class="translated-word" data-index="2">単語</span>. You can toggle an entry to swap it <span class="translated-word" data-index="3">切り替える</span> for the original English, or for its phonetic pronunciation.

// Now for an excerpt from a popular Japanese folktale: Momotaro.

// "Long ago, in a <span class="translated-word" data-index="4">小さい</span> <span class="translated-word" data-index="5">村</span> in <span class="translated-word" data-index="6">日本</span>, an <span class="translated-word" data-index="7">年老いた</span> <span class="translated-word" data-index="8">男</span> and <span class="translated-word" data-index="9">女</span> lived together by the mountains. The <span class="translated-word" data-index="10">男</span> went <span class="translated-word" data-index="11">出かける</span> <span class="translated-word" data-index="12">毎日</span> <span class="translated-word" data-index="13">日</span> to <span class="translated-word" data-index="14">切る</span> <span class="translated-word" data-index="15">草</span> and <span class="translated-word" data-index="16">集める</span> firewood, while the <span class="translated-word" data-index="17">女</span> stayed <span class="translated-word" data-index="18">家</span> to wash <span class="translated-word" data-index="19">服</span> and cook meals. Though they were kind and hardworking, they had no children, and this made them very <span class="translated-word" data-index="20">悲しい</span>.