import Link from "next/link";

export function AppNav() {
  return (
    <header className="top-nav">
      <Link className="brand" href="/">
        <strong>拍照学英语</strong>
        <span>现实物品变成英语贴纸</span>
      </Link>
      <nav className="nav-links" aria-label="主导航">
        <Link className="nav-link" href="/">
          拍照
        </Link>
        <Link className="nav-link" href="/library">
          词库
        </Link>
        <Link className="nav-link" href="/settings">
          设置
        </Link>
      </nav>
    </header>
  );
}
