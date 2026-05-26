import React from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

const TermsOfUse = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] selection:bg-naija-green/30">
      <LandingHeader />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-24 text-white" role="main">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-naija-gold">Terms of Use</h1>
        
        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            <p>
              Welcome to Scriptyn. These Terms of Use ("Terms") govern your access to and use of the Scriptyn website, 
              applications, and services (collectively, the "Services"). Please read these Terms carefully before using our Services.
            </p>
            <p className="mt-4">
              By accessing or using the Services, you agree to be bound by these Terms. If you disagree with any part of the terms, 
              then you may not access the Services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">1. Accounts and Registration</h2>
            <p className="mb-4">
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
              Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            </p>
            <p>
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions 
              under your password. You agree not to disclose your password to any third party.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">2. Intellectual Property and Content Ownership</h2>
            <p className="mb-4">
              <strong>Your Content:</strong> You retain all of your ownership rights in your scripts, outlines, and other creative content ("User Content") 
              that you create, upload, or share on Scriptyn. We claim no intellectual property rights over your User Content.
            </p>
            <p className="mb-4">
              <strong>License to Us:</strong> By uploading User Content, you grant us a limited, worldwide, non-exclusive license to host, store, and 
              reproduce your User Content solely for the purpose of operating, developing, and providing the Services to you and your authorized collaborators.
            </p>
            <p>
              <strong>Our Content:</strong> The Service and its original content (excluding User Content), features, AI models, and functionality are and will 
              remain the exclusive property of Scriptyn and its licensors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">3. Acceptable Use</h2>
            <p className="mb-4">You agree not to use the Service:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>In any way that violates any applicable national or international law or regulation.</li>
              <li>To exploit, harm, or attempt to exploit or harm minors in any way.</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material without our prior written consent.</li>
              <li>To impersonate or attempt to impersonate Scriptyn, a Scriptyn employee, another user, or any other person or entity.</li>
              <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">4. AI Features and Disclaimer</h2>
            <p>
              Scriptyn utilizes artificial intelligence to assist with screenwriting. AI-generated suggestions are provided "as is" and should be reviewed 
              by you before adoption. We do not guarantee the accuracy, originality, or copyrightability of AI-generated text. You are solely responsible 
              for the final content of your scripts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">5. Limitation of Liability</h2>
            <p>
              In no event shall Scriptyn, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, 
              special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
              resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">6. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide 
              at least 30 days' notice prior to any new terms taking effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-white">7. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at support@scriptyn.com.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default TermsOfUse;
