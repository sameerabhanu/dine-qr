import { CheckCircle, Smartphone, Zap, Shield, Headphones, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Why Digital Ordering Fee? - DineQR',
  description: 'Understanding the ₹8 digital ordering fee and how it benefits your dining experience',
};

export default function WhyOrderingFeePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-black transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why Do We Charge ₹8 Digital Ordering Fee?
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A small fee that powers a seamless, contactless dining experience while supporting restaurant operations
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Order Processing</h3>
            <p className="text-gray-600">
              Your order reaches the kitchen immediately with real-time notifications to waiters, ensuring faster service and hot, fresh food.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No App Download Required</h3>
            <p className="text-gray-600">
              Simply scan the QR code on your table. No need to download apps, create accounts, or share personal information.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Hygienic & Contactless</h3>
            <p className="text-gray-600">
              Digital menus eliminate the need for physical menus that pass through many hands, ensuring a safer dining experience.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <Headphones className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">24/7 Technical Support</h3>
            <p className="text-gray-600">
              The fee helps maintain our servers, ensure uptime, and provide continuous technical support to restaurants and customers.
            </p>
          </div>
        </div>

        {/* What You Get Section */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What Your ₹8 Includes:</h2>
          <div className="space-y-4">
            {[
              'Real-time order tracking from kitchen to your table',
              'Instant menu updates with current availability',
              'Order customization and special requests',
              'Digital itemized bill generation',
              'Complimentary water bottle with every order',
              'Secure payment infrastructure',
              'Multi-order management for your table',
              'Priority customer support',
            ].map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Value Comparison */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border border-green-200 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Putting It In Perspective</h2>
          <p className="text-gray-700 mb-6">
            At just ₹8 per order, our digital ordering fee is less than the cost of:
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-gray-900 mb-1">₹10</p>
              <p className="text-sm text-gray-600">Service charge at most restaurants</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-gray-900 mb-1">₹15</p>
              <p className="text-sm text-gray-600">Average parking fee</p>
            </div>
            <div className="bg-white rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-gray-900 mb-1">₹20</p>
              <p className="text-sm text-gray-600">Delivery platform fees</p>
            </div>
          </div>
        </div>

        {/* How It Helps */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How This Fee Helps Restaurants</h2>
          <p className="text-gray-700 mb-6">
            The ₹8 digital ordering fee helps restaurants:
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-green-700">1</span>
              <span>Reduce staff workload, allowing them to focus on food quality and customer service</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-green-700">2</span>
              <span>Minimize order errors with direct kitchen communication</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-green-700">3</span>
              <span>Track customer preferences and improve menu offerings</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold text-green-700">4</span>
              <span>Maintain a modern, tech-enabled dining experience without huge upfront costs</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="text-center mt-12 py-8">
          <p className="text-gray-600 mb-6">
            Have questions about the digital ordering fee?
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Menu
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} DineQR. Making dining experiences better, one order at a time.</p>
        </div>
      </footer>
    </div>
  );
}
