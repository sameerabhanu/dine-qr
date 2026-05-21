import Link from 'next/link';
import { QrCode, Smartphone, ChefHat, BarChart3, Zap, Shield, ArrowRight, Check } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header - Compact & Mobile Responsive */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group">
              <div className="w-7 h-7 sm:w-9 sm:h-9 bg-black rounded-lg flex items-center justify-center">
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900">DineQR</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-black transition">
                Features
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 sm:px-5 sm:py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all hover:shadow-lg hover:shadow-black/10"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section - Compact */}
      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-50 rounded-full mb-4 sm:mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs sm:text-sm font-medium text-gray-700">Transform your restaurant experience</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">
              Modern QR Ordering
              <span className="block mt-1 sm:mt-2">for Restaurants</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
              Let customers order directly from their phones. No app downloads, no commissions, no complexity. Just scan and order.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link
                href="/register"
                className="group px-6 py-3 sm:px-8 sm:py-4 bg-black text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-gray-800 transition-all hover:shadow-2xl hover:shadow-black/20 flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                <span>Setup in minutes</span>
              </div>
            </div>
          </div>

          {/* Stats - Compact */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 max-w-2xl mx-auto mt-12 sm:mt-16 md:mt-20 pt-12 sm:pt-16 md:pt-20 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-1 sm:mb-2">Quick</div>
              <div className="text-xs sm:text-sm text-gray-500">Setup Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-1 sm:mb-2">Easy</div>
              <div className="text-xs sm:text-sm text-gray-500">To Use</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Compact */}
      <section id="features" className="py-16 sm:py-20 md:py-24 bg-gray-50 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
              Everything you need,
              <span className="block mt-1 sm:mt-2">nothing you don&apos;t</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              A complete ordering solution designed for modern restaurants
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <FeatureCard
              icon={<QrCode className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="QR Code Ordering"
              description="Customers scan, browse, and order instantly. No app installation required."
            />
            <FeatureCard
              icon={<Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Mobile First"
              description="Optimized for smartphones. Works flawlessly on any device."
            />
            <FeatureCard
              icon={<ChefHat className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Kitchen Display"
              description="Orders appear instantly. Track preparation in real-time."
            />
            <FeatureCard
              icon={<BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Analytics"
              description="Understand your business with detailed insights and reports."
            />
            <FeatureCard
              icon={<Zap className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Real-time Updates"
              description="Instant notifications. Zero delays. Perfect synchronization."
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5 sm:w-6 sm:h-6" />}
              title="Secure & Reliable"
              description="Bank-grade security. 99.9% uptime guarantee."
            />
          </div>
        </div>
      </section>

      {/* CTA Section - Compact */}
      <section className="py-16 sm:py-20 md:py-24 px-3 sm:px-4 md:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Ready to transform your restaurant?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-6 sm:mb-8 md:mb-10 max-w-2xl mx-auto">
            Request a demo and we&apos;ll set up DineQR for your restaurant
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 bg-white text-black rounded-xl hover:bg-gray-100 transition-all text-sm sm:text-base font-semibold hover:shadow-2xl hover:shadow-white/20"
          >
            Request Demo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer - Compact */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-black rounded-lg flex items-center justify-center">
                <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="text-base sm:text-lg font-bold text-gray-900">DineQR</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
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
    <div className="group bg-white p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-gray-100 hover:border-gray-900 transition-all hover:shadow-xl hover:shadow-black/5">
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 rounded-lg sm:rounded-xl flex items-center justify-center text-gray-900 mb-4 sm:mb-5 group-hover:bg-gray-900 group-hover:text-white transition-all">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
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
