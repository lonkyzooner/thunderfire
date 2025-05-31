import React from "react";
import { Button } from "../components/ui/button";
import LarkLogo from "../components/LarkLogo";

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-900 to-blue-950">
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <LarkLogo className="w-10 h-10" />
          <span className="text-2xl font-bold text-white">LARK</span>
        </div>
        <nav className="flex gap-4">
          <a href="/pricing" className="text-white hover:underline">Pricing</a>
          <a href="/login" className="text-white hover:underline">Login</a>
          <a href="/signup">
            <Button className="ml-2">Sign Up</Button>
          </a>
        </nav>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center text-center px-4">
        <h1 className="text-5xl font-extrabold text-white mb-6 drop-shadow-lg">
          Law Enforcement Assistance and Response Kit
        </h1>
        <p className="text-xl text-blue-200 mb-8 max-w-2xl">
          Modern tools for officers and agencies: voice-activated workflows, instant statute lookups, secure reporting, and more. Built for safety, speed, and compliance.
        </p>
        <div className="flex gap-4 justify-center">
          <a href="/pricing">
            <Button variant="outline" className="text-white border-white">See Pricing</Button>
          </a>
          <a href="/signup">
            <Button>Get Started</Button>
          </a>
        </div>
      </main>
      <footer className="text-center text-blue-300 py-6">
        &copy; {new Date().getFullYear()} LARK. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
