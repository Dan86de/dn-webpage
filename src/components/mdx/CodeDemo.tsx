import { useState } from "react";

export interface CodeDemoProps {
  code: string;
  title?: string;
}

export function CodeDemo({ code, title }: CodeDemoProps) {
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string>("");

  const runCode = () => {
    setError("");
    setOutput("");

    try {
      const logs: string[] = [];
      const customConsole = {
        log: (...args: any[]) => {
          logs.push(args.map((arg) => String(arg)).join(" "));
        },
      };

      const func = new Function("console", code);
      func(customConsole);

      setOutput(logs.join("\n"));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        padding: "1rem",
        marginTop: "1rem",
        marginBottom: "1rem",
      }}
    >
      {title && (
        <h4
          style={{
            marginTop: 0,
            marginBottom: "0.75rem",
            fontSize: "1.125rem",
            fontWeight: 600,
          }}
        >
          {title}
        </h4>
      )}

      <pre
        style={{
          backgroundColor: "#f3f4f6",
          padding: "0.75rem",
          borderRadius: "0.25rem",
          overflowX: "auto",
          marginBottom: "0.75rem",
        }}
      >
        <code>{code}</code>
      </pre>

      <button
        onClick={runCode}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "0.25rem",
          cursor: "pointer",
          marginBottom: "0.75rem",
        }}
      >
        Run Code
      </button>

      {output && (
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "0.25rem",
            padding: "0.75rem",
            marginTop: "0.75rem",
          }}
        >
          <strong>Output:</strong>
          <pre
            style={{
              marginTop: "0.5rem",
              marginBottom: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {output}
          </pre>
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "0.25rem",
            padding: "0.75rem",
            marginTop: "0.75rem",
          }}
        >
          <strong>Error:</strong>
          <pre
            style={{
              marginTop: "0.5rem",
              marginBottom: 0,
              whiteSpace: "pre-wrap",
              color: "#dc2626",
            }}
          >
            {error}
          </pre>
        </div>
      )}
    </div>
  );
}
