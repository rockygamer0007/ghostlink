import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "GhostLink",
  description: "Share secrets that vanish.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}