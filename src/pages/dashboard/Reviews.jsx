import { useState, useEffect } from 'react';
import { Star, MessageSquare, Package, Search } from 'lucide-react';
import api from '../../api/axios';

const Reviews = () => {
  const [reviewedProducts, setReviewedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Fetch all vendor products
        const res = await api.get('/products');
        const allProducts = res.data?.data?.products || [];
        
        // Filter to only show products that actually have reviews
        const productsWithFeedback = allProducts.filter(p => p.reviews && p.reviews.length > 0);
        
        // Sort products by the most recently updated/reviewed (optional)
        productsWithFeedback.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        setReviewedProducts(productsWithFeedback);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star key={index} className={`w-4 h-4 ${index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
    ));
  };

  const filteredProducts = reviewedProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="text-gray-500 font-medium p-6">Loading customer reviews...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2 text-[#128C7E]" />
            Customer Reviews
          </h2>
          <p className="text-gray-500 mt-1 text-sm">See what your customers are saying about your products.</p>
        </div>
        
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search reviewed products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#25D366] text-sm" 
          />
        </div>
      </div>

      {reviewedProducts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mb-4">
            <Star className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-500 max-w-md">
            When customers leave feedback on your storefront, their ratings and comments will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Product Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{product.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-0.5">
                      <span className="font-semibold text-[#128C7E] mr-2">{product.reviews.length} Reviews</span>
                      • 
                      <span className="ml-2 flex items-center">
                        Avg: {product.averageRating ? product.averageRating.toFixed(1) : 5.0} <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 ml-1" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews Grid */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {product.reviews.map((review, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-bold text-gray-900 text-sm block">{review.customerName}</span>
                        <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex">{renderStars(review.rating)}</div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">"{review.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;