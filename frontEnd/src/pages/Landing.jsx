import React, { useEffect, useRef, useState } from "react";
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
  Shield,
  Database,
  FileCheck,
} from "lucide-react";

/* ─── Animated counter hook ─── */
const useCounter = (target, duration = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const numTarget = parseInt(target.replace(/[^0-9]/g, ""), 10) || 0;

          const step = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.floor(eased * numTarget));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
};

/* ─── Scroll reveal hook ─── */
const useScrollReveal = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
};

/* ─── Stat component ─── */
const AnimatedStat = ({ value, label, suffix = "" }) => {
  const { count, ref } = useCounter(value);
  const numericPart = value.replace(/[^0-9.]/g, "");
  const prefix = value.replace(/[0-9.%+<]/g, "").trim() || "";
  const hasSuffix = value.includes("+") ? "+" : value.includes("%") ? "%" : suffix;
  const hasLessThan = value.includes("<");

  return (
    <div ref={ref} className="text-center group">
      <p className="text-3xl sm:text-4xl font-extrabold text-gray-800 count-animate">
        {hasLessThan && "<"}{count}{hasSuffix}
      </p>
      <p className="text-gray-500 text-sm mt-1.5 font-medium">{label}</p>
    </div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const hero = useScrollReveal();
  const howItWorks = useScrollReveal();
  const stakeholders = useScrollReveal();
  const security = useScrollReveal();

  const stats = [
    { value: "5000000+", display: "5M+", label: "Records Verified" },
    { value: "800+", display: "800+", label: "Institutions" },
    { value: "99%", display: "99.9%", label: "Uptime" },
    { value: "<2", display: "<2hrs", label: "Avg Turnaround" },
  ];

  const steps = [
    {
      icon: <Search size={26} />,
      title: "Submit Request",
      desc: "Employers or universities submit verification requests with student details.",
      bg: "bg-blue-100 text-blue-600",
      num: "01",
    },
    {
      icon: <CheckCircle size={26} />,
      title: "Institution Verifies",
      desc: "University staff checks the records and confirms authenticity.",
      bg: "bg-emerald-100 text-emerald-600",
      num: "02",
    },
    {
      icon: <Award size={26} />,
      title: "Get Certificate",
      desc: "A tamper-proof digital certificate is generated and delivered.",
      bg: "bg-purple-100 text-purple-600",
      num: "03",
    },
  ];

  const stakeholderData = [
    {
      icon: <Users size={28} />,
      title: "Students",
      desc: "View your records, manage consent, and track who accessed your data.",
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      icon: <Building size={28} />,
      title: "Institutions",
      desc: "Digitize records and process verification requests efficiently.",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      icon: <Globe size={28} />,
      title: "Employers & Verifiers",
      desc: "Receive verified academic data in minutes instead of weeks.",
      gradient: "from-amber-500 to-orange-600",
    },
  ];

  const features = [
    { icon: <Shield size={20} />, title: "End-to-End Encryption" },
    { icon: <Database size={20} />, title: "ACID Transactions" },
    { icon: <FileCheck size={20} />, title: "Complete Audit Trail" },
    { icon: <Lock size={20} />, title: "Role-Based Access" },
  ];

  return (
    <div className="font-[Poppins] w-full">

      {/* ═══ HERO ═══ */}
      <section className="relative bg-gradient-to-br from-indigo-700 via-blue-700 to-purple-700 text-white py-24 sm:py-32 overflow-hidden">
        {/* Animated particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${8 + i * 8}%`,
                top: `${15 + (i % 4) * 20}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${4 + (i % 3) * 2}s`,
                width: `${3 + (i % 3) * 2}px`,
                height: `${3 + (i % 3) * 2}px`,
              }}
            />
          ))}
        </div>

        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/15 rounded-full blur-3xl" />

        <div ref={hero.ref} className={`max-w-6xl mx-auto px-6 text-center relative z-10 transition-all duration-1000 ${hero.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-5 py-1.5 rounded-full text-sm mb-8 border border-white/10">
            <Zap size={14} className="text-yellow-300" />
            <span>Trusted by 800+ Institutions Nationwide</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Student Qualification
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-200 to-purple-300 bg-clip-text text-transparent">
              Verification System
            </span>
          </h1>

          <p className="mt-6 text-blue-100/90 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            India's trusted platform for verifying academic qualifications.
            Instant, secure and tamper-proof verification powered by the
            Ministry of Education.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <button
              onClick={() => navigate("/login")}
              className="group flex items-center gap-2 bg-white text-blue-700 px-7 py-3.5 rounded-xl font-bold hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              Get Started
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate("/verify/search")}
              className="border-2 border-white/30 px-7 py-3.5 rounded-xl font-semibold hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
            >
              Verify Certificate
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-blue-200/60 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <Shield size={14} /> SSL Encrypted
            </div>
            <div className="w-1 h-1 bg-blue-300/30 rounded-full hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Database size={14} /> ACID Compliant
            </div>
            <div className="w-1 h-1 bg-blue-300/30 rounded-full hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Lock size={14} /> GDPR Ready
            </div>
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="bg-white py-16 border-b border-gray-100">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 px-6">
          {stats.map((item, index) => (
            <AnimatedStat key={index} value={item.value} label={item.label} />
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="bg-gray-50 py-20 sm:py-24">
        <div ref={howItWorks.ref} className={`max-w-6xl mx-auto px-6 transition-all duration-700 ${howItWorks.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-16">
            <p className="text-blue-600 text-sm font-bold uppercase tracking-widest">
              Simple Process
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-3">
              How It Works
            </h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Three simple steps to verify any academic qualification securely
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 group relative"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Step number */}
                <div className="absolute top-4 right-4 text-4xl font-black text-gray-100 group-hover:text-blue-50 transition-colors select-none">
                  {step.num}
                </div>

                <div className={`w-16 h-16 mx-auto flex items-center justify-center rounded-2xl ${step.bg} group-hover:scale-110 transition-transform duration-300`}>
                  {step.icon}
                </div>

                <h3 className="font-bold text-lg mt-6 text-gray-800">
                  {step.title}
                </h3>

                <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STAKEHOLDERS ═══ */}
      <section className="bg-white py-20 sm:py-24">
        <div ref={stakeholders.ref} className={`max-w-6xl mx-auto px-6 transition-all duration-700 ${stakeholders.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-16">
            <p className="text-indigo-600 text-sm font-bold uppercase tracking-widest">
              Stakeholders
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-3">
              Built for Everyone
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
            {stakeholderData.map((item, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 group"
              >
                <div className={`w-16 h-16 mx-auto flex items-center justify-center rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>

                <h3 className="font-bold text-gray-800 text-lg mt-5">
                  {item.title}
                </h3>

                <p className="text-gray-500 text-sm mt-3 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ DATABASE FEATURES ═══ */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
            
            <div className="relative z-10 text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                Enterprise-Grade Database Architecture
              </h2>
              <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto mb-10">
                Built with 15 normalized tables, 8 triggers, and a complete
                transaction management system for data integrity.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {features.map((f, i) => (
                  <div
                    key={i}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="text-blue-400 mb-2 flex justify-center">{f.icon}</div>
                    <p className="text-white text-xs font-semibold">{f.title}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm">
                <div className="text-gray-400">
                  <span className="text-2xl font-extrabold text-white">15</span> Tables
                </div>
                <div className="text-gray-400">
                  <span className="text-2xl font-extrabold text-white">8</span> Triggers
                </div>
                <div className="text-gray-400">
                  <span className="text-2xl font-extrabold text-white">6</span> Transaction Scenarios
                </div>
                <div className="text-gray-400">
                  <span className="text-2xl font-extrabold text-white">30+</span> Indexes
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECURE CTA ═══ */}
      <section ref={security.ref} className={`bg-white py-20 text-center px-6 transition-all duration-700 ${security.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25 animate-float">
          <Lock size={28} className="text-white" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
          Secure by Design
        </h2>

        <p className="text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
          Built with end-to-end encryption, role-based access control,
          and complete audit trails. Your data remains safe with us.
        </p>

        <button
          onClick={() => navigate("/login")}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5"
        >
          Start Verifying Now
        </button>
      </section>
    </div>
  );
};

export default Landing;