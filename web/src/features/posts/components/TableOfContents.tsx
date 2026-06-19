"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentHtml?: string;
}

/**
 * 文章目录导航
 */
export function TableOfContents({ contentHtml }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!contentHtml) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(contentHtml, "text/html");
    const elements = Array.from(doc.querySelectorAll("h2, h3"));
    const parsed = elements.map((el) => {
      const id =
        el.id ||
        el.textContent
          ?.toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, "") ||
        "";
      return {
        id,
        text: el.textContent ?? "",
        level: Number.parseInt(el.tagName[1], 10),
      };
    });
    setHeadings(parsed);
  }, [contentHtml]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    for (const heading of headings) {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 rounded-2xl border border-border/50 bg-card/60 p-5 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/40">
        <h2 className="mb-4 text-sm font-semibold">目录</h2>
        <nav className="max-h-[calc(100vh-220px)] overflow-y-auto">
          <ul className="space-y-2">
            {headings.map((heading) => (
              <li key={heading.id} style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}>
                <a
                  href={`#${heading.id}`}
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={cn(
                    "block border-l-2 py-1 pr-2 text-sm transition-colors",
                    activeId === heading.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                    heading.level === 3 && "text-xs",
                  )}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
