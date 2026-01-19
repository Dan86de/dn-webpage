import { useState } from "react";

export function TestButton() {
  const [count, setCount] = useState(0);

  return (
    <button
      onClick={() => setCount(count + 1)}
      style={{
        padding: "0.5rem 1rem",
        backgroundColor: "#3b82f6",
        color: "white",
        border: "none",
        borderRadius: "0.25rem",
        cursor: "pointer",
      }}
    >
      Clicked {count} times
    </button>
  );
}
