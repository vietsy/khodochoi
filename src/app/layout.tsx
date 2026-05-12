import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/styles/reset.scss"
import "@/styles/globals.scss"

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
})

export const metadata: Metadata = {
    title: "Kho đồ chơi Ngân Anh",
    description: "Kho đồ chơi Ngân Anh",
    icons: {
        icon: "/images/favicon.png",
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className={inter.className}>
            <body>{children}</body>
        </html>
    )
}
