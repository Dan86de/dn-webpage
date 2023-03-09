import Logo from "./Logo";
import Link from "next/link";

export default function Header() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between py-4">
      <Link href="/" className="flex items-center gap-4">
        <Logo className="h-10 w-10" />
      </Link>
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
