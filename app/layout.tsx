import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientInit } from "@/components/ClientInit";
import { WhiteLabelProvider } from "@/components/WhiteLabelProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Aaraazi",
    description: "Aaraazi Agency Portal",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const defaultThemeScript = `
(function() {
  var path = typeof window !== 'undefined' && window.location ? window.location.pathname : '';
  var isAgencyCodePage = path === '/auth/agency-code';
  var root = typeof document !== 'undefined' ? document.documentElement : null;
  if (!root) return;
  var setDefault = function() {
    root.style.setProperty('--primary', '#A85D42');
    root.style.setProperty('--secondary', '#C17052');
    root.style.setProperty('--accent', '#E8E2D5');
    root.style.setProperty('--background', '#ffffff');
    root.style.setProperty('--foreground', '#171717');
  };
  if (isAgencyCodePage) {
    setDefault();
    return;
  }
  try {
    var raw = typeof localStorage !== 'undefined' && localStorage.getItem('aaraazi-auth-storage');
    if (!raw) { setDefault(); return; }
    var data = JSON.parse(raw);
    var b = data && data.state && data.state.branding;
    if (!b) { setDefault(); return; }
    if (b.primaryColor) root.style.setProperty('--primary', b.primaryColor);
    if (b.secondaryColor) root.style.setProperty('--secondary', b.secondaryColor.trim());
    if (b.accentColor) root.style.setProperty('--accent', b.accentColor.trim());
    if (b.backgroundColor) root.style.setProperty('--background', b.backgroundColor.trim());
  } catch (e) {
    setDefault();
  }
})();
`;

    return (
        <html lang="en">
            <head>
                <script dangerouslySetInnerHTML={{ __html: defaultThemeScript }} />
            </head>
            <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground`}>
                <AuthProvider>
                    <WhiteLabelProvider>
                        <ClientInit />
                        {children}
                    </WhiteLabelProvider>
                </AuthProvider>
            </body>
        </html>
    );
}

