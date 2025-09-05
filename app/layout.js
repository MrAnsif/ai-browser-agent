import './globals.css';

export const metadata = {
  title: 'AI Browser Agent',
  description: 'Natural language browser automation with JavaScript',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}