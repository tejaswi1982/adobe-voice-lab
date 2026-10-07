import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
import "./globals.css";

const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Adobe Voice Lab · Speculative prototype",
  description:
    "An independent speculative prototype exploring how AI might help writers make better choices. Not affiliated with or endorsed by Adobe.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f4f0e6",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <a className="skip-link" href="#lab">
          Skip to the lab
        </a>
        {children}
      </body>
    </html>
  );
}
