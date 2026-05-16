"use client";

type Props = {
  text: string;
};

export function SpeakButton({ text }: Props) {
  function speak() {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.88;
    const voice = window.speechSynthesis
      .getVoices()
      .find((item) => item.lang.toLowerCase().startsWith("en"));

    if (voice) {
      utterance.voice = voice;
    }

    window.speechSynthesis.speak(utterance);
  }

  return (
    <button className="secondary-button" onClick={speak} type="button">
      播放发音
    </button>
  );
}
