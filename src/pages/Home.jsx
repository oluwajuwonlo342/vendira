import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Share2, 
  MessageSquare, 
  Check, 
  ArrowRight, 
  PlusCircle, 
  Sparkles,
  Smartphone,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#F4FBF7] text-gray-900 font-sans">
      
      {/* =======================
          TOP WARNING / PROMO BANNER (Instant Context)
          ======================= */}
      <div className="bg-[#075E54] text-white py-2 px-4 text-center text-xs md:text-sm font-medium flex items-center justify-center space-x-2">
        <Sparkles className="w-4 h-4 animate-pulse text-emerald-300" />
        <span>Tired of endless "Is this available?" messages? Build your free WhatsApp Catalogue today!</span>
      </div>

      {/* =======================
          NAVIGATION
          ======================= */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-emerald-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-black tracking-tight text-[#128C7E] flex items-center">
            <span>Vendira</span>
            <span className="text-[#25D366]">.</span>
          </div>
          <div className="hidden md:flex space-x-8 items-center font-semibold">
            <a href="#how-it-works" className="text-gray-600 hover:text-[#128C7E] transition">How It Works</a>
            <a href="#features" className="text-gray-600 hover:text-[#128C7E] transition">Features</a>
            <Link to="/login" className="text-gray-700 hover:text-[#128C7E] transition">Log in</Link>
            <Link to="/register" className="bg-[#128C7E] text-white px-5 py-2.5 rounded-full hover:bg-[#075E54] transition shadow-md hover:shadow-lg flex items-center">
              Start Free 
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>
      </nav>

      {/* =======================
          HERO SECTION (Clarity & Conversions)
          ======================= */}
      <header className="relative pt-12 md:pt-20 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Clear value prop */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8">
            {/* Quick Badge */}
            <div className="inline-flex items-center space-x-2 bg-emerald-100/75 border border-emerald-200 text-[#128C7E] px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#25D366] animate-ping" />
              <span>Free WhatsApp Catalogue Maker</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Turn Your WhatsApp Into A Beautiful <br />
              <span className="text-[#128C7E] relative inline-block">
                Online Shop
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-[#25D366]" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0,5 Q50,10 100,5" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed">
              Stop spamming your WhatsApp status with 50 images! Upload your products, share a single link with customers, and receive neatly formatted orders directly in your WhatsApp chats.
            </p>

            {/* Visual Steps (FLOW CHART - Quick Learn) */}
            <div className="grid grid-cols-3 gap-2 bg-white p-4 rounded-2xl border border-emerald-100/50 shadow-sm md:max-w-xl">
              <div className="text-center">
                <span className="bg-emerald-50 text-[#128C7E] w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2 border border-emerald-100">1</span>
                <p className="text-xs font-bold text-gray-800">Add Products</p>
                <span className="text-[10px] text-gray-400 block hidden sm:block">Upload photos & prices</span>
              </div>
              <div className="text-center border-x border-gray-100">
                <span className="bg-emerald-50 text-[#128C7E] w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2 border border-emerald-100">2</span>
                <p className="text-xs font-bold text-gray-800">Share Shop Link</p>
                <span className="text-[10px] text-gray-400 block hidden sm:block">Put it in your social bio</span>
              </div>
              <div className="text-center">
                <span className="bg-emerald-50 text-[#128C7E] w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-2 border border-emerald-100">3</span>
                <p className="text-xs font-bold text-gray-800">Get WhatsApp Orders</p>
                <span className="text-[10px] text-gray-400 block hidden sm:block">Structured DMs</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/register" className="bg-[#128C7E] text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-[#075E54] hover:shadow-xl transition-all text-center flex items-center justify-center space-x-2">
                <span>Create Your Shop Free</span>
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link to="/store/demo-store" className="bg-white text-[#128C7E] border-2 border-[#128C7E] px-8 py-4 rounded-full text-lg font-bold hover:bg-[#F4FBF7] transition-all text-center">
                View Demo Store
              </Link>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-500 font-semibold pl-2">
              <span className="flex items-center"><Check className="w-4 h-4 mr-1 text-[#25D366] stroke-[3]" /> No complex code</span>
              <span className="flex items-center"><Check className="w-4 h-4 mr-1 text-[#25D366] stroke-[3]" /> Free to start</span>
            </div>
          </div>

          {/* Right Column: Dynamic Mobile Preview mockup */}
          <div className="lg:col-span-5 flex justify-center relative">
            {/* Soft backdrop glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#25D366]/20 rounded-full blur-3xl -z-10" />
            
            <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl border-4 border-gray-100 w-full max-w-[320px]">
              <div className="border border-gray-100 rounded-[2rem] overflow-hidden bg-gray-50">
                {/* Simulated App Bar */}
                <div className="bg-[#075E54] text-white p-4 flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs text-emerald-300">🏪</div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">My Clothes Plug</h4>
                    <span className="text-[10px] text-emerald-300">Active Shop</span>
                  </div>
                </div>

                {/* Items */}
                <div className="p-3 space-y-3">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="h-32 bg-emerald-50 rounded-lg flex items-center justify-center text-2xl">🧥</div>
                    <div className="mt-2">
                      <p className="text-xs font-extrabold text-gray-800">Casual Oversized jacket</p>
                      <p className="text-[#128C7E] text-xs font-black mt-0.5">₦14,500</p>
                      <div className="flex space-x-1 mt-1">
                        <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-medium">Size L</span>
                        <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-medium">Blue</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Simulated checkout CTA */}
                  <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl flex items-center justify-between text-xs font-bold text-[#128C7E]">
                    <span>Cart: (1 item)</span>
                    <button className="bg-[#25D366] text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 hover:bg-emerald-500 transition shadow">
                      <span>Order on WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* =======================
          "HOW IT WORKS" VISUAL FLOW
          ======================= */}
      <section id="how-it-works" className="py-20 bg-white border-y border-emerald-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="text-[#128C7E] font-extrabold text-sm uppercase tracking-widest">3 Simple Steps</span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900">How does Vendira work?</h2>
            <p className="text-lg text-gray-500">Go from sign up to your first online sale in less than 5 minutes.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative p-6 rounded-2xl bg-[#F4FBF7] border border-emerald-50">
              <div className="bg-emerald-100 text-[#128C7E] w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl mb-6 shadow-sm">1</div>
              <h3 className="text-xl font-extrabold mb-2 text-gray-900 flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <span>Quick Registration</span>
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Create an account, name your business, and get your own custom URL link (e.g. <span className="font-mono text-[#128C7E] font-semibold text-xs bg-emerald-50 px-1 rounded">vendira.com/store/yourbrand</span>) that’s yours forever.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-[#F4FBF7] border border-emerald-50">
              <div className="bg-emerald-100 text-[#128C7E] w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl mb-6 shadow-sm">2</div>
              <h3 className="text-xl font-extrabold mb-2 text-gray-900 flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <span>Upload Your Items</span>
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Add your product images, descriptions, sizes, colors, and prices using our intuitive, zero-code vendor dashboard. We format everything automatically.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-[#F4FBF7] border border-emerald-50">
              <div className="bg-emerald-100 text-[#128C7E] w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl mb-6 shadow-sm">3</div>
              <h3 className="text-xl font-extrabold mb-2 text-gray-900 flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-emerald-600" />
                <span>Share & Receive Orders</span>
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Put your catalogue link in your Instagram bio, TikTok, or WhatsApp status. Customers choose what they want, and click to send a perfectly pre-filled message straight to your phone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =======================
          FEATURES DESIGNED FOR WHATSAPP
          ======================= */}
      <section id="features" className="py-20 bg-emerald-50/20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="text-[#128C7E] font-extrabold text-sm uppercase tracking-widest">Platform Features</span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900">Why sell on Vendira?</h2>
            <p className="text-lg text-gray-500">Traditional web stores are too complex. Social selling doesn't have to be.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-50">
              <div className="bg-emerald-100/50 w-12 h-12 rounded-lg flex items-center justify-center text-[#128C7E] mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold mb-2 text-gray-900">Immediate WhatsApp Connection</h4>
              <p className="text-gray-600 text-sm leading-relaxed">No shopping carts get abandoned in an unknown system. Every checkout attempts directly links straight into your DM with fully structured user intents.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-50">
              <div className="bg-emerald-100/50 w-12 h-12 rounded-lg flex items-center justify-center text-[#128C7E] mb-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold mb-2 text-gray-900">Super-Fast Mobile Catalogue</h4>
              <p className="text-gray-600 text-sm leading-relaxed">Most buyers shop from their phones. Vendira catalogues load in less than 1.5 seconds, even on patchy, low-bandwidth internet.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-50">
              <div className="bg-emerald-100/50 w-12 h-12 rounded-lg flex items-center justify-center text-[#128C7E] mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold mb-2 text-gray-900">Customer Confidence</h4>
              <p className="text-gray-600 text-sm leading-relaxed">A structured, polished store with prices publicly listed boosts buyer trust, reducing friction and securing more upfront sales.</p>
            </div>
          </div>
        </div>
      </section>

      {/* =======================
          CTA SECTION
          ======================= */}
      <section className="bg-[#075E54] text-white py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-5xl font-black">Join thousands of smart vendors selling on WhatsApp.</h2>
          <p className="text-emerald-150 max-w-md mx-auto text-sm md:text-base">No card details required. Create your catalog today and take the stress out of status selling.</p>
          <Link to="/register" className="inline-block bg-[#25D366] hover:bg-emerald-500 text-white px-10 py-5 rounded-full text-lg font-black tracking-wide shadow-lg hover:shadow-xl transition-all">
            Get Started Free
          </Link>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-100 py-10 text-center text-xs font-semibold text-gray-400">
        <p>&copy; {new Date().getFullYear()} Vendira. Stop Status Spams. Start Selling.</p>
      </footer>

    </div>
  );
};

export default Home;