import { JetBrains_Mono, Outfit } from "next/font/google";
import "../styles/globals.css";

const geistSans = Outfit({
    variable: "--font-outfit",
    subsets: ["latin"],
});

const geistMono = JetBrains_Mono({
    variable: "--font-jetbrains-mono",
    subsets: ["latin"],
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
        </html>
    );
}
