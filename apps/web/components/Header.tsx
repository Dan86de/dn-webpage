import Logo from "./Logo";

export default function Header() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between py-4">
      <div className="flex items-center gap-4">
        <Logo className="h-10 w-10" />
        <h1 className="text-2xl font-semibold">Daniel Noworyta</h1>
      </div>
      <nav className="flex space-x-4">
        <a href="/" className="underline">
          Home
        </a>
        <a href="/blog" className="underline">
          Blog
        </a>
      </nav>
    </header>
  );
}
