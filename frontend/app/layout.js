import { Sarabun } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import ChatbotWidget from "../components/ChatbotWidget";
import PwaRegister from "../components/PwaRegister";

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun"
});

export const metadata = {
  title: "Lom Wong Café & Daily Rooms",
  description: "ล้อมวง คาเฟ่ ร้านอาหาร คาเฟ่ และห้องพักรายวันในขอนแก่น",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Lom Wong Admin"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className={sarabun.variable}>
      <body>
        <PwaRegister />
        <Navbar />
        <main className="min-h-screen pt-20">{children}</main>
        <ChatbotWidget />
      </body>
    </html>
  );
}
