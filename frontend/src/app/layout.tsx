import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { AWSHeader } from '@/components/layout/AWSHeader';
import { AWSSidebar } from '@/components/layout/AWSSidebar';
import { NotificationBanner } from '@/components/layout/NotificationBanner';

export const metadata: Metadata = {
  title: 'Route 53 - AWS Management Console',
  description: 'Amazon Route 53 DNS and Domain Name Management Web Console Clone',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#f2f3f3] dark:bg-[#0f172a] text-[#16191f] dark:text-gray-100 min-h-screen flex flex-col antialiased">
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              {/* AWS Top Navigation Header */}
              <AWSHeader />

              {/* Main Console Workspace */}
              <div className="flex-1 flex overflow-hidden">
                {/* Route 53 Left Sidebar */}
                <AWSSidebar />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col">
                  <NotificationBanner />
                  <div className="flex-1">
                    {children}
                  </div>
                </main>
              </div>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
