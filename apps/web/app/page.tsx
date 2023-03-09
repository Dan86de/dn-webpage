import { Button } from "ui";

export default function Homepage() {
  return (
    <div>
      <h1 className="text-5xl font-bold text-center max-w-xl mx-auto mt-[140px]">
        There is some heading text about this page.
      </h1>
      <h2 className="text-2xl font-medium text-center max-w-xl mx-auto mt-6">
        There is some subheading for this page.
      </h2>
      <Button />
    </div>
  );
}
