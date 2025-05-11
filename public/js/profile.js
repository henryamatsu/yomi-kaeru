class Translator {
    constructor() {
      this.preferences = window.preferences;

      this.translationMap = {};
      this.textType = "input";
      this.currentWordElement = null;
  
      this.setupQuerySelectors();
      this.setupEventListeners();

      this.createTranslationMap();
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

    // translate map v2
    async createTranslationMap() {
      const grades = this.preferences.grades;
      let allData = {};
  
      if (grades.grade1) {
        const res = await fetch("/json/grade1Map.json");
        const data = await res.json();  
        allData = {...allData, ...data};
      }
      if (grades.grade2) {
        const res = await fetch("/json/grade2Map.json");
        const data = await res.json();  
        allData = {...allData, ...data};
      }
      if (grades.grade3) {
        const res = await fetch("/json/grade3Map.json");
        const data = await res.json();  
        allData = {...allData, ...data};
      }
      
      this.translationMap = allData;
    }

    // translate map v1
    // async createTranslationMap() {
    //   const grades = this.preferences.grades;
    //   let allData = [];
  
    //   if (grades.grade1) {
    //     const res = await fetch("/json/grade1.json");
    //     const data = await res.json();  
    //     allData = [...allData, ...data];
    //   }
    //   if (grades.grade2) {
    //     const res = await fetch("/json/grade2.json");
    //     const data = await res.json();  
    //     allData = [...allData, ...data];
    //   }
    //   if (grades.grade3) {
    //     const res = await fetch("/json/grade3.json");
    //     const data = await res.json();  
    //     allData = [...allData, ...data];
    //   }
      
    //   allData.forEach(entry => {
    //     this.translationMap[entry.heisig_en] = entry;
    //   });
    // }
  
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
      this.createTranslationMap();

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
  
    convertInputText() {
      this.textType = "display";
      
      this.translateButton.innerText = "New Translation";
      this.textDisplay.style = "display: block;"
      this.textInput.style = "display: none;"
      this.sampleTextButton.style = "display: none;"
  
      this.textDisplay.innerText = this.textInput.value;
  
      this.translateEligibleWords();
    }

    // translate v2
    async translateEligibleWords() {
      // in theory, this design should be pretty easy to port over to translating multiple text elements
      const text = this.textDisplay.innerText;

      // split the text element into sentences based on punctuation marks
      let sentenceArr = text.split(/([.!?]+)/);

      // reattach the punctuation marks
      sentenceArr = sentenceArr.reduce((acc, e, i) => {
        if (i % 2 == 0) {
          return [...acc, e]
        }
        else {
          acc[acc.length - 1] += e;
          return acc;
        }
      }, []);
    
      // this array will store the data that we send to gemini
      let eligibleArr = [];

      sentenceArr.forEach((sentence, i) => {
        // split each sentence into words
        const wordArr = sentence.split(/([^a-zA-Z\d]+)/);
        // store each English word - Japanese kanji pair
        const wordPairs = [];

        // testing not sending the kanji
        const eligibleWords = [];

        wordArr.forEach(word => {
          // roll to see if we're going to attempt to replace this word
          const replacementChance = Math.round(Math.random() * 100) < +this.preferences.frequency;

          // if the word is in the map and we rolled under the replacement threshold, we'll add it to the wordPairs array
          if (this.translationMap[word] && replacementChance) {
            wordPairs.push([word, this.translationMap[word]]);
            eligibleWords.push(word);
          }
        });

        // we build an object with data that gemini will need to make the translation
        const eligibleData = {
          eligibleWords,
          sentence,
          sentenceIndex: i // this is so we can find and replace the original sentence after translation
        } 

        eligibleArr.push(eligibleData);
      });

      // remove entries for sentences with 0 translation-eligible words
      eligibleArr = eligibleArr.filter(e => e.eligibleWords.length > 0);

      // limit size for testing
      eligibleArr = eligibleArr.slice(0, 5);

      // console.log(JSON.stringify(eligibleArr));
  
      const geminiData = await fetch("/translation?_method=GET", {
        method: "post",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(eligibleArr)
      });

      console.log(geminiData);
    }

    // translate v1
    // async translateEligibleWords() {
    //   const text = this.textDisplay.innerText;
    //   const textArr = text.split(" ");
  
    //   const translatedArr = textArr.map(word => {
    //     const replacementChance = Math.round(Math.random() * 100) < +this.preferences.frequency;
  
    //     return this.translationMap[word] && replacementChance ? `<span class="translated-word" data-key="${word}">${this.translationMap[word].kanji}</span>` : word;
    //   });
    //   // might need regex to deal with words with punctuation attached/ words with spaces in between
  
    //   this.textDisplay.innerHTML = translatedArr.join(" ");
    // }
  
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
      const key = event.target.dataset.key;
      const entry = this.translationMap[key];
      
      this.infoPopup.querySelector("#english-reading").innerText = entry.heisig_en;
      this.infoPopup.querySelector("#hiragana-reading").innerText = entry.kun_readings.join(", ");
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
  
  new Translator();