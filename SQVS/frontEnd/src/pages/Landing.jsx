import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  CheckCircle,
  Award,
  Users,
  Building,
  Globe,
  Zap,
  Lock,
  ArrowRight,
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const stats = [
    { value: "5M+", label: "Records Verified", color: "text-blue-600" },
    { value: "800+", label: "Institutions", color: "text-indigo-600" },
    { value: "99.9%", label: "Uptime", color: "text-green-600" },
    { value: "<2hrs", label: "Avg Turnaround", color: "text-purple-600" },
  ];

  const steps = [
    {
      icon: <Search size={26} />,
      title: "Submit Request",
      desc: "Employers or universities submit verification requests with student details.",
      bg: "bg-blue-100 text-blue-600",
    },
    {
      icon: <CheckCircle size={26} />,
      title: "Institution Verifies",
      desc: "University staff checks the records and confirms authenticity.",
      bg: "bg-green-100 text-green-600",
    },
    {
      icon: <Award size={26} />,
      title: "Get Certificate",
      desc: "A tamper-proof digital certificate is generated and delivered.",
      bg: "bg-purple-100 text-purple-600",
    },
  ];

  const stakeholders = [
    {
      icon: <Users size={26} />,
      title: "Students",
      desc: "View your records, manage consent, and track who accessed your data.",
      bg: "bg-blue-100 text-blue-600",
    },
    {
      icon: <Building size={26} />,
      title: "Institutions",
      desc: "Digitize records and process verification requests efficiently.",
      bg: "bg-green-100 text-green-600",
    },
    {
      icon: <Globe size={26} />,
      title: "Employers & Verifiers",
      desc: "Receive verified academic data in minutes instead of weeks.",
      bg: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="font-[Poppins] w-full">

      {/* HERO */}
      <section className="bg-gradient-to-br from-indigo-700 via-blue-700 to-purple-700 text-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">

          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1 rounded-full text-sm mb-6">
            <Zap size={14} />
            Trusted by 800+ Institutions Nationwide
          </div>

          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Student Qualification
            <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              {" "}Verification System
            </span>
          </h1>

          <p className="mt-6 text-blue-100 max-w-2xl mx-auto">
            India's trusted platform for verifying academic qualifications.
            Instant, secure and tamper-proof verification powered by the
            Ministry of Education.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-10">

            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Get Started
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => navigate("/verify/search")}
              className="border border-white px-6 py-3 rounded-lg hover:bg-white/10 transition"
            >
              Verify Certificate
            </button>

          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center px-6">
          {stats.map((item, index) => (
            <div key={index}>
              <p className={`text-3xl font-bold ${item.color}`}>
                {item.value}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">

          <div className="text-center mb-14">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider">
              Simple Process
            </p>
            <h2 className="text-3xl font-bold text-gray-800 mt-2">
              How It Works
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">

            {steps.map((step, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-xl text-center shadow-sm hover:shadow-md transition"
              >

                <div className={`w-14 h-14 mx-auto flex items-center justify-center rounded-lg ${step.bg}`}>
                  {step.icon}
                </div>

                <h3 className="font-semibold text-lg mt-6">
                  {step.title}
                </h3>

                <p className="text-gray-500 text-sm mt-3">
                  {step.desc}
                </p>

              </div>
            ))}

          </div>
        </div>
      </section>

      {/* STAKEHOLDERS */}
      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">

          <div className="text-center mb-14">
            <p className="text-indigo-600 text-sm font-semibold uppercase tracking-wider">
              Stakeholders
            </p>
            <h2 className="text-3xl font-bold text-gray-800 mt-2">
              Built for Everyone
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">

            {stakeholders.map((item, index) => (
              <div
                key={index}
                className="p-6 rounded-xl text-center hover:shadow-md transition"
              >

                <div className={`w-14 h-14 mx-auto flex items-center justify-center rounded-lg ${item.bg}`}>
                  {item.icon}
                </div>

                <h3 className="font-semibold text-gray-800 mt-4">
                  {item.title}
                </h3>

                <p className="text-gray-500 text-sm mt-2">
                  {item.desc}
                </p>

              </div>
            ))}

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-20 text-center px-6">

        <Lock size={36} className="text-blue-400 mx-auto mb-6" />

        <h2 className="text-3xl font-bold text-white mb-4">
          Secure by Design
        </h2>

        <p className="text-gray-400 max-w-xl mx-auto mb-8">
          Built with end-to-end encryption, GDPR-compliant data handling
          and complete audit trails. Your data remains safe with us.
        </p>

        <button
          onClick={() => navigate("/login")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition"
        >
          Start Verifying Now
        </button>

      </section>

    </div>
  );
};

export default Landing;