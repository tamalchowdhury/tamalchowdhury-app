import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Sidebar from "./components/sidebar"
import Header from "./components/header"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "তমাল এ চৌধুরী # সহজ ভাষায় প্রোগ্রামিং",
  description: "সহজ বাংলা ভাষায় প্রোগ্রামিং এর সব জটিল কনসেপ্ট গুলো লিখে যাচ্ছি। HTML, CSS, JavaScript, Python, PHP, Vibe Coding সহ আরো অনেক কিছু",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='bn-BD'>
      <body
        className={`bg-slate-200 text-[#333] min-h-screen
          
         ${inter.className}`}
      >
        <Script
          src='https://www.googletagmanager.com/gtag/js?id=G-TZFY3QDPLZ'
          strategy='afterInteractive'
        />
        <Script id='google-analytics' strategy='afterInteractive'>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-TZFY3QDPLZ');
          `}
        </Script>
        <Header />
        <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,650px)_minmax(0,1fr)] gap-0 lg:gap-[40px] bg-white min-h-[600px] max-w-[1050px] mx-auto px-0 sm:px-4 lg:px-[80px] py-4 lg:py-[40px]'>
          <main className='min-h-full min-w-0 p-4 sm:p-5 lg:p-0 leading-relaxed'>
            {children}
          </main>
          <Sidebar />
        </div>
      </body>
    </html>
  )
}
