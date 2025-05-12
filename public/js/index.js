class HoverHandler {
  constructor() {
    this.translationReference = [{"japanese":"カーソルを合わせる","english":"you","romaji":"kāsoru o awaseru"},{"japanese":"単語","english":"word","romaji":"tango"},{"japanese":"見る","english":"see","romaji":"miru"},{"japanese":"単語","english":"word","romaji":"tango"},{"japanese":"代替","english":"out","romaji":"daitai"},{"japanese":"小さい","english":"small","romaji":"chiisai"},{"japanese":"村","english":"village","romaji":"mura"},{"japanese":"日本","english":"Japan","romaji":"Nihon"},{"japanese":"年老いた","english":"old","romaji":"toshioita"},{"japanese":"男","english":"man","romaji":"otoko"},{"japanese":"女","english":"woman","romaji":"onna"},{"japanese":"男","english":"man","romaji":"otoko"},{"japanese":"出かける","english":"out","romaji":"dekakeru"},{"japanese":"毎日","english":"everyday","romaji":"mainichi"},{"japanese":"日","english":"day","romaji":"nichi"},{"japanese":"切る","english":"cut","romaji":"kiru"},{"japanese":"草","english":"grass","romaji":"kusa"},{"japanese":"集める","english":"gather","romaji":"atsumeru"},{"japanese":"女","english":"woman","romaji":"onna"},{"japanese":"家","english":"home","romaji":"ie"},{"japanese":"服","english":"clothes","romaji":"fuku"},{"japanese":"悲しい","english":"sad","romaji":"kanashii"}];
    this.currentWordElement = null;

    this.setupQuerySelectors();
    this.setupEventListeners();
  }

  setupQuerySelectors() {
    this.infoPopup = document.querySelector("#info-popup");
  }

  setupEventListeners() {
    document.addEventListener("mouseover", this.displayHoverInfo.bind(this));
    document.addEventListener("mouseout", this.hideHoverInfo.bind(this));
    document.addEventListener("click", this.changeReading.bind(this));
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
      this.infoPopup.classList.add("below-midpoint");
      this.infoPopup.classList.remove("above-midpoint");
    }
    else {
      this.infoPopup.classList.add("above-midpoint");
      this.infoPopup.classList.remove("below-midpoint");
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
}

const hoverHandler = new HoverHandler();