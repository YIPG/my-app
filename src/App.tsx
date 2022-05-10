import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";

const kanaExtractionPattern = /[^ 　ぁあ-んー]/g;
const isHiragana = (str: string) => str.match(/^[ぁ-んー　]*$/);

function App() {
  const [kanji, setKanji] = useState("");
  const [kana, setKana] = useState("");
  const [curWord, setCurWord] = useState("");
  const [onComposition, setOnComposition] = useState(false);

  const handleOnchange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value;

    if (!newInput) {
      setKana("");
      return;
    }
  };

  const handleOnCompositionStart = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    setOnComposition(true);
  };

  const handleOnCompositionUpdate = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    if (!onComposition) return;
    const input = e.data;

    if (isHiragana(input)) {
      setCurWord(input);
    }
  };

  const handleOnCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    setOnComposition(false);
    console.log(curWord);
    setKana((prevKana) => prevKana + curWord);
    setCurWord("");
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>

        <input
          onChange={handleOnchange}
          onCompositionStart={handleOnCompositionStart}
          onCompositionUpdate={handleOnCompositionUpdate}
          onCompositionEnd={handleOnCompositionEnd}
        />
        <input
          onChange={(e) => {
            console.log(e);
          }}
          value={kana}
        />
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
