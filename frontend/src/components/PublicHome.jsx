import { useState } from "react";

export default function PublicHome({ onGetStarted }) {
  const [mobileMenu, setMobileMenu] = useState(false);

  const features = [
    {
      icon: "🧭",
      title: "Smart Indoor Navigation",
      desc: "Get turn-by-turn directions to any department, room, or facility inside the hospital. Wheelchair-accessible routes available.",
    },
    {
      icon: "🤖",
      title: "AI Department Finder",
      desc: "Not sure which doctor to see? Describe your symptoms and our AI will suggest the right department for you.",
    },
    {
      icon: "📅",
      title: "Easy Appointments",
      desc: "Book appointments with your preferred doctor in seconds. Get real-time updates on your appointment status.",
    },
    {
      icon: "⏱️",
      title: "Live Token Queue",
      desc: "Track your token position in real-time. No more waiting outside the doctor's cabin for hours.",
    },
    {
      icon: "🔔",
      title: "Smart Notifications",
      desc: "Receive instant updates about your appointments, queue status, and important hospital information.",
    },
    {
      icon: "🏥",
      title: "Complete Hospital Management",
      desc: "For doctors and admins: manage patients, appointments, departments, and analytics all in one place.",
    },
  ];

  const steps = [
    { num: "01", title: "Register / Login", desc: "Create your patient account or login with your credentials." },
    { num: "02", title: "Find Your Way", desc: "Describe your symptoms or search for a department directly." },
    { num: "03", title: "Book Appointment", desc: "Choose your doctor, pick a time slot, and confirm your appointment." },
    { num: "04", title: "Track & Visit", desc: "Track your token live, follow the indoor map, and reach your doctor on time." },
  ];

  const departments = [
    { name: "Cardiology", icon: "❤️" },
    { name: "Neurology", icon: "🧠" },
    { name: "Orthopedics", icon: "🦴" },
    { name: "Dermatology", icon: "🩺" },
    { name: "ENT", icon: "👂" },
    { name: "General Medicine", icon: "💊" },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">
                ✚
              </div>
              <div>
                <h1 className="font-bold text-gray-900 text-lg leading-tight">MediNav360</h1>
                <p className="text-xs text-gray-500 leading-tight">Smart Hospital Navigation</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">Features</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">How it Works</a>
              <a href="#departments" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition">Departments</a>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={onGetStarted}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition"
              >
                Sign In
              </button>
              <button
                onClick={onGetStarted}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenu && (
            <div className="md:hidden py-4 border-t border-gray-100 space-y-3">
              <a href="#features" onClick={() => setMobileMenu(false)} className="block px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenu(false)} className="block px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">How it Works</a>
              <a href="#departments" onClick={() => setMobileMenu(false)} className="block px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">Departments</a>
              <button
                onClick={onGetStarted}
                className="w-full px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-6">
                🏥 Trusted by Hospitals
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Better navigation.
                <br />
                <span className="text-blue-600">Better care.</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                Navigate hospitals effortlessly. Find departments, book appointments, track live token queues, and get AI-powered health assistance — all in one place.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={onGetStarted}
                  className="px-8 py-4 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-xl shadow-blue-200 flex items-center gap-2"
                >
                  Book Appointment
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
                <button
                  onClick={onGetStarted}
                  className="px-8 py-4 text-base font-semibold text-gray-700 bg-white rounded-xl hover:bg-gray-50 transition border border-gray-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Watch Demo
                </button>
              </div>

              <div className="mt-10 flex items-center gap-8">
                <div>
                  <p className="text-3xl font-bold text-gray-900">10K+</p>
                  <p className="text-sm text-gray-500">Patients Helped</p>
                </div>
                <div className="w-px h-12 bg-gray-200"></div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">50+</p>
                  <p className="text-sm text-gray-500">Departments</p>
                </div>
                <div className="w-px h-12 bg-gray-200"></div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">100+</p>
                  <p className="text-sm text-gray-500">Doctors</p>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="ml-2 text-xs text-gray-400">MediNav360 — Navigation</span>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 h-64 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-10 left-10 w-32 h-32 border-2 border-blue-300 rounded-lg"></div>
                    <div className="absolute top-20 right-10 w-24 h-24 border-2 border-blue-300 rounded-lg"></div>
                    <div className="absolute bottom-10 left-20 w-40 h-20 border-2 border-blue-300 rounded-lg"></div>
                  </div>
                  <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl shadow-lg mb-3">
                      📍
                    </div>
                    <p className="font-semibold text-gray-800">You are here</p>
                    <p className="text-sm text-gray-500">Entrance</p>
                    <div className="mt-4 px-4 py-2 bg-white rounded-lg shadow-md text-sm font-medium text-blue-600">
                      → Cardiology, Room 204
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-800">28m</p>
                    <p className="text-xs text-gray-500">Distance</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-800">~1 min</p>
                    <p className="text-xs text-gray-500">Est. Time</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-green-600">✓</p>
                    <p className="text-xs text-gray-500">Accessible</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Features</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">Everything you need in one place</h2>
            <p className="mt-4 text-lg text-gray-600">From finding the right department to tracking your appointment — we've got you covered.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl mb-4">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">How it Works</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">Get started in 4 simple steps</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative">
                <div className="text-5xl font-bold text-blue-100 mb-4">{s.num}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 -right-4 text-blue-200">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DEPARTMENTS PREVIEW ===== */}
      <section id="departments" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Departments</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">Find the right specialist</h2>
            <p className="mt-4 text-lg text-gray-600">Our hospital has specialized departments with experienced doctors.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((d, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-2xl group-hover:bg-blue-100 transition">
                    {d.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{d.name}</h3>
                    <p className="text-sm text-gray-500">View doctors →</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to navigate smarter?</h2>
          <p className="mt-4 text-lg text-blue-100">Join thousands of patients who save time and get better care with MediNav360.</p>
          <button
            onClick={onGetStarted}
            className="mt-8 px-8 py-4 text-base font-semibold text-blue-600 bg-white rounded-xl hover:bg-blue-50 transition shadow-xl"
          >
            Get Started — It's Free
          </button>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">✚</div>
                <span className="font-bold text-white">MediNav360</span>
              </div>
              <p className="text-sm leading-relaxed">Smart hospital navigation and management system for better patient care.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-blue-400 transition">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-blue-400 transition">How it Works</a></li>
                <li><a href="#departments" className="hover:text-blue-400 transition">Departments</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-blue-400 transition">Help Center</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-blue-400 transition">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Emergency</h4>
              <p className="text-sm">24/7 Emergency Helpline</p>
              <p className="text-2xl font-bold text-white mt-1">108</p>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-sm">
            © 2026 MediNav360. All rights reserved. Built with ❤️ for better healthcare.
          </div>
        </div>
      </footer>

    </div>
  );
}