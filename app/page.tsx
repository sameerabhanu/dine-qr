import Link from 'next/link';
import { QrCode, Smartphone, ChefHat, BarChart3, Zap, Shield, ArrowRight, Check } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">DineQR</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-black transition">
                Features
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all hover:shadow-lg hover:shadow-black/10"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-gray-700">Transform your restaurant experience</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
              Modern QR Ordering
              <span className="block mt-2">for Restaurants</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Let customers order directly from their phones. No app downloads, no commissions, no complexity. Just scan and order.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register"
                className="group px-8 py-4 bg-black text-white text-base font-semibold rounded-xl hover:bg-gray-800 transition-all hover:shadow-2xl hover:shadow-black/20 flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Check className="w-4 h-4 text-green-500" />
                <span>Setup in minutes</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto mt-20 pt-20 border-t border-gray-100">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Quick</div>
              <div className="text-sm text-gray-500">Setup Time</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Easy</div>
              <div className="text-sm text-gray-500">To Use</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything you need,
              <span className="block mt-2">nothing you don&apos;t</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A complete ordering solution designed for modern restaurants
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<QrCode className="w-6 h-6" />}
              title="QR Code Ordering"
              description="Customers scan, browse, and order instantly. No app installation required."
            />
            <FeatureCard
              icon={<Smartphone className="w-6 h-6" />}
              title="Mobile First"
              description="Optimized for smartphones. Works flawlessly on any device."
            />
            <FeatureCard
              icon={<ChefHat className="w-6 h-6" />}
              title="Kitchen Display"
              description="Orders appear instantly. Track preparation in real-time."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Analytics"
              description="Understand your business with detailed insights and reports."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Real-time Updates"
              description="Instant notifications. Zero delays. Perfect synchronization."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Secure & Reliable"
              description="Bank-grade security. 99.9% uptime guarantee."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to transform your restaurant?
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Request a demo and we&apos;ll set up DineQR for your restaurant
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-xl hover:bg-gray-100 transition-all text-base font-semibold hover:shadow-2xl hover:shadow-white/20"
          >
            Request Demo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <QrCode className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">DineQR</span>
            </div>
            <div className="text-sm text-gray-500">
              © 2026 DineQR. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-gray-900 transition-all hover:shadow-xl hover:shadow-black/5">
      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-900 mb-5 group-hover:bg-gray-900 group-hover:text-white transition-all">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function PricingFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
        <Check className="w-3 h-3 text-gray-900" />
      </div>
      <span className="text-gray-700">{text}</span>
    </li>
  );
}
