import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeContext';

export const metadata: Metadata = {
  title: 'Charan Sai — Independent Developer & Digital Solutions',
  description:
    'Official portfolio of Charan Sai. Full-stack developer, B.Tech CSE (Data Science) at St. Ann\'s College of Engineering & Technology, Chirala, India. Modern web applications, Java desktop systems, and interactive digital solutions.',
  keywords: [
    'Charan Sai',
    'Full Stack Developer',
    'Independent Developer',
    'Digital Solutions',
    'Data Science',
    'Next.js',
    'React',
    'Java',
    'Flutter',
    'Chirala',
    'India',
  ],
  authors: [{ name: 'Charan Sai' }],
  openGraph: {
    title: 'Charan Sai — Independent Developer & Digital Solutions',
    description:
      'Immersive personal portfolio and freelance digital solutions by Charan Sai. Exploring modern web architectures and 3D web experiences.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
