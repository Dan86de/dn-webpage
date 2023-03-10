import { Button } from "ui";

export default function Homepage() {
  return (
    <div className="container px-4">
      <h1 className="text-3xl lg:text-5xl font-semibold text-center max-w-xl mx-auto mt-[140px]">
        My name is Daniel Noworyta and this is my webpage.
      </h1>
      <h2 className="text-2xl font-medium text-center max-w-xl mx-auto mt-6">
        Coming soon....
      </h2>
      <Button className="lg:w-[400px] bg-gradient-30 from-[#F15613] to-[#F26913]">
        Subscribe newsletter
      </Button>
      <div className="mx-auto flex flex-col justify-center gap-10 w-3/4 mt-20 lg:mt-40">
        <p className="font-mono font-regular text-lg lg:text-4xl bg-gradient-30 from-[#F15613] to-[#F26913] text-transparent bg-clip-text text-left">
          Consuming more does not mean having more ideas/inspirations.
        </p>
        <p className="font-mono font-regular text-lg lg:text-4xl bg-gradient-30 from-[#F15613] to-[#F26913] text-transparent bg-clip-text text-right">
          Sonke Ahrens
        </p>
      </div>
    </div>
  );
}
