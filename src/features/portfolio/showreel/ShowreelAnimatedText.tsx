import { Fragment } from "react";
import { splitShowreelWords } from "./showreelSplitWords";

type Props = {
  text: string;
};

/**
 * Wraps each word in its own span so the enter timeline can stagger them
 * individually (kinetic word-by-word reveal) instead of animating the whole
 * line as one block. Spaces stay as literal text nodes between spans so the
 * browser's normal line-wrapping — and text-wrap: balance on the parent —
 * keeps working unmodified.
 */
export function ShowreelAnimatedText({ text }: Props) {
  const words = splitShowreelWords(text);
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="showreel-anim-word">{word}</span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}
