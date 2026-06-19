/**
 * 前台页脚
 */
export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Mimo Blog. All rights reserved.
      </div>
    </footer>
  );
}
