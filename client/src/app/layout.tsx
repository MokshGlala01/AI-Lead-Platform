import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CampusFlow — AI-Powered Student Qualification & Enrollment Platform',
  description: 'Automate lead collection, run AI qualification, generate personalized copy, and balance counselors round-robin.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-brand-bg text-brand-white selection:bg-brand-primary/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
