import { Button } from "ui";
import { Analytics } from '@vercel/analytics/react';

export default function Web() {
  return (
    <div>
      <h1>Hello World!</h1>
      <Button />
      <Analytics/>
    </div>
  );
}
