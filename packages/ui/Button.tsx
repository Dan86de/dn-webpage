import * as React from "react";
import { clsx } from "tailwind-config";

interface ButtonProps {
  children?: React.ReactNode;
  text?: string;
  className?: string;
}

export const Button = ({
  children,
  text = "button",
  className = "",
}: ButtonProps) => {
  return (
    <button
      type="button"
      className={clsx(
        "text-neutral-900 text-2xl font-medium flex grow justify-center align-center bg-neutral-300 rounded-2xl px-8 py-4 mx-auto mt-12 pointer block",
        className
      )}
    >
      {children}
    </button>
  );
};
