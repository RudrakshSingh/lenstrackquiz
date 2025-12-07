import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../components/layout/AdminLayout';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { offerService } from '../../services/offers';
import { useToast } from '../../contexts/ToastContext';
import OfferBreakdownPanel from '../../components/offer/OfferBreakdownPanel';
import UpsellBanner from '../../components/offer/UpsellBanner';
import {
  Tag,
  Percent,
  Ticket,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  TrendingUp,
  Users,
  Package,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Layers,
  Target,
  DollarSign,
  Gift,
  ShoppingCart,
  Sparkles,
  Play,
  Loader
} from 'lucide-react';

export default function OfferMappingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('rules');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Data states
  const [offerRules, setOfferRules] = useState([]);
  const [categoryDiscounts, setCategoryDiscounts] = useState([]);
  const [coupons, setCoupons] = useState([]);

  // Simulation states
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [applicableOffers, setApplicableOffers] = useState([]);
  const [simulationCart, setSimulationCart] = useState({
    frame: { brand: 'LENSTRACK', subCategory: 'ADVANCED', mrp: 4000 },
    lens: { itCode: 'D360ASV', price: 2500, brandLine: 'DIGI360_ADVANCED', yopoEligible: true },
    customerCategory: 'STUDENT',
    couponCode: 'WELCOME10'
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [rulesResponse, discountsResponse, couponsResponse] = await Promise.all([
        offerService.listRules().catch(() => ({ data: [] })),
        offerService.listCategoryDiscounts().catch(() => ({ data: [] })),
        offerService.listCoupons().catch(() => ({ data: [] }))
      ]);
      setOfferRules(Array.isArray(rulesResponse) ? rulesResponse : (rulesResponse?.data || rulesResponse || []));
      setCategoryDiscounts(Array.isArray(discountsResponse) ? discountsResponse : (discountsResponse?.data || discountsResponse || []));
      setCoupons(Array.isArray(couponsResponse) ? couponsResponse : (couponsResponse?.data || couponsResponse || []));
    } catch (error) {
      console.error('Error loading offer data:', error);
      showToast('error', 'Failed to load offer data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type, id) => {
    try {
      if (type === 'rule') {
        await offerService.deleteRule(id);
      } else if (type === 'coupon') {
        await offerService.deleteCoupon(id);
      }
      showToast('success', 'Deleted successfully');
      setDeleteConfirm(null);
      fetchAllData();
    } catch (error) {
      showToast('error', error.message || 'Failed to delete');
    }
  };

  const getOfferTypeIcon = (type) => {
    switch (type) {
      case 'YOPO':
        return <TrendingUp className="h-5 w-5" />;
      case 'FREE_LENS':
        return <Gift className="h-5 w-5" />;
      case 'COMBO_PRICE':
        return <ShoppingCart className="h-5 w-5" />;
      case 'PERCENT_OFF':
        return <Percent className="h-5 w-5" />;
      case 'FLAT_OFF':
        return <DollarSign className="h-5 w-5" />;
      case 'BOGO_50':
        return <Layers className="h-5 w-5" />;
      default:
        return <Tag className="h-5 w-5" />;
    }
  };

  const getOfferTypeColor = (type) => {
    switch (type) {
      case 'YOPO':
        return 'purple';
      case 'FREE_LENS':
        return 'green';
      case 'COMBO_PRICE':
        return 'blue';
      case 'PERCENT_OFF':
        return 'orange';
      case 'FLAT_OFF':
        return 'red';
      case 'BOGO_50':
        return 'pink';
      default:
        return 'gray';
    }
  };

  const filteredRules = offerRules.filter(rule =>
    rule.name?.toLowerCase().includes(search.toLowerCase()) ||
    rule.code?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code?.toLowerCase().includes(search.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(search.toLowerCase())
  );

  const activeRulesCount = offerRules.filter(r => r.isActive).length;
  const activeCouponsCount = coupons.filter(c => c.isActive).length;
  const activeCategoryDiscountsCount = categoryDiscounts.filter(c => c.isActive).length;

  // Check which offers are applicable for current cart
  const checkApplicableOffers = () => {
    const applicable = offerRules.filter(rule => {
      if (!rule.isActive) return false;
      
      // Check frame brand
      if (rule.frameBrand && rule.frameBrand !== simulationCart.frame.brand) {
        if (!rule.frameBrands || !rule.frameBrands.includes(simulationCart.frame.brand)) {
          return false;
        }
      }
      
      // Check frame sub category
      if (rule.frameSubCategory && rule.frameSubCategory !== simulationCart.frame.subCategory) {
        if (!rule.frameSubCategories || !rule.frameSubCategories.includes(simulationCart.frame.subCategory)) {
          return false;
        }
      }
      
      // Check min/max MRP
      if (rule.minFrameMRP && simulationCart.frame.mrp < rule.minFrameMRP) return false;
      if (rule.maxFrameMRP && simulationCart.frame.mrp > rule.maxFrameMRP) return false;
      
      // Check lens brand line
      if (rule.lensBrandLines && rule.lensBrandLines.length > 0) {
        if (!rule.lensBrandLines.includes(simulationCart.lens.brandLine)) return false;
      }
      
      // Check YOPO eligibility
      if (rule.offerType === 'YOPO' && !simulationCart.lens.yopoEligible) return false;
      
      return true;
    });
    
    setApplicableOffers(applicable);
    return applicable;
  };

  const runSimulation = async () => {
    setSimulationLoading(true);
    setSimulationResult(null);
    try {
      // Check applicable offers first
      checkApplicableOffers();
      
      const result = await offerService.calculate({
        frame: simulationCart.frame,
        lens: simulationCart.lens,
        customerCategory: simulationCart.customerCategory || null,
        couponCode: simulationCart.couponCode || null
      });
      // Handle response structure
      const resultData = result?.data || result;
      console.log('Simulation result:', resultData);
      setSimulationResult(resultData);
    } catch (error) {
      console.error('Simulation error:', error);
      showToast('error', error.message || 'Failed to run simulation');
      setSimulationResult({ error: error.message });
    } finally {
      setSimulationLoading(false);
    }
  };

  // Update applicable offers when cart or rules change
  useEffect(() => {
    if (offerRules.length > 0) {
      checkApplicableOffers();
    } else {
      setApplicableOffers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationCart, offerRules]);

  return (
    <AdminLayout title="Offer Mapping">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-8 w-8" />
                <h1 className="text-3xl font-bold">Offer Engine Mapping</h1>
              </div>
              <p className="text-indigo-100 text-lg">
                Visualize and manage all offer rules, category discounts, and coupons
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{activeRulesCount}</div>
                <div className="text-sm text-indigo-100">Active Rules</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{activeCouponsCount}</div>
                <div className="text-sm text-indigo-100">Active Coupons</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Offer Rules</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{offerRules.length}</p>
                <p className="text-xs text-green-600 mt-1">{activeRulesCount} active</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Tag className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Category Discounts</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{categoryDiscounts.length}</p>
                <p className="text-xs text-green-600 mt-1">{activeCategoryDiscountsCount} active</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Coupons</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{coupons.length}</p>
                <p className="text-xs text-green-600 mt-1">{activeCouponsCount} active</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Ticket className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Active</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {activeRulesCount + activeCouponsCount + activeCategoryDiscountsCount}
                </p>
                <p className="text-xs text-gray-500 mt-1">All offers</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Target className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'rules', label: 'Offer Rules', icon: Tag, count: offerRules.length },
                { id: 'categories', label: 'Category Discounts', icon: Users, count: categoryDiscounts.length },
                { id: 'coupons', label: 'Coupons', icon: Ticket, count: coupons.length },
                { id: 'simulation', label: 'Simulation', icon: Play, count: null }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                      ${activeTab === tab.id
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                    {tab.count !== null && (
                      <Badge color={activeTab === tab.id ? 'blue' : 'gray'} variant="soft" size="sm">
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Search and Actions */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              {activeTab === 'rules' && (
                <Button
                  onClick={() => router.push('/admin/offer-entry')}
                  icon={<Plus className="h-4 w-4" />}
                >
                  New Rule
                </Button>
              )}
              {activeTab === 'coupons' && (
                <Button
                  onClick={() => router.push('/admin/coupon-entry')}
                  icon={<Plus className="h-4 w-4" />}
                >
                  New Coupon
                </Button>
              )}
              {activeTab === 'categories' && (
                <Button
                  onClick={() => router.push('/admin/category-discount-entry')}
                  icon={<Plus className="h-4 w-4" />}
                >
                  New Discount
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'rules' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-12 text-gray-500">Loading...</div>
                ) : filteredRules.length === 0 ? (
                  <div className="text-center py-12">
                    <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No offer rules found</p>
                    <Button
                      onClick={() => router.push('/admin/offer-entry')}
                      className="mt-4"
                      icon={<Plus className="h-4 w-4" />}
                    >
                      Create First Rule
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredRules.map((rule) => (
                      <div
                        key={rule._id || rule.id}
                        className="bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            rule.offerType === 'YOPO' ? 'bg-purple-100' :
                            rule.offerType === 'FREE_LENS' ? 'bg-green-100' :
                            rule.offerType === 'COMBO_PRICE' ? 'bg-blue-100' :
                            rule.offerType === 'PERCENT_OFF' ? 'bg-orange-100' :
                            rule.offerType === 'FLAT_OFF' ? 'bg-red-100' :
                            rule.offerType === 'BOGO_50' ? 'bg-pink-100' :
                            'bg-gray-100'
                          }`}>
                            <div className={
                              rule.offerType === 'YOPO' ? 'text-purple-600' :
                              rule.offerType === 'FREE_LENS' ? 'text-green-600' :
                              rule.offerType === 'COMBO_PRICE' ? 'text-blue-600' :
                              rule.offerType === 'PERCENT_OFF' ? 'text-orange-600' :
                              rule.offerType === 'FLAT_OFF' ? 'text-red-600' :
                              rule.offerType === 'BOGO_50' ? 'text-pink-600' :
                              'text-gray-600'
                            }>
                              {getOfferTypeIcon(rule.offerType)}
                            </div>
                          </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">{rule.name}</h3>
                              <p className="text-sm text-gray-500">{rule.code}</p>
                            </div>
                          </div>
                          <Badge color={rule.isActive ? 'green' : 'gray'} variant="soft">
                            {rule.isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Target className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Priority: <strong>{rule.priority}</strong></span>
                          </div>
                          {rule.frameBrand && (
                            <div className="flex items-center gap-2 text-sm">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Frame: <strong>{rule.frameBrand}</strong></span>
                            </div>
                          )}
                          {rule.minFrameMRP && (
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">Min MRP: <strong>₹{rule.minFrameMRP}</strong></span>
                            </div>
                          )}
                          {rule.lensBrandLines?.length > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <Layers className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600">
                                Brands: <strong>{rule.lensBrandLines.slice(0, 2).join(', ')}</strong>
                                {rule.lensBrandLines.length > 2 && ` +${rule.lensBrandLines.length - 2}`}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/admin/offer-entry?id=${rule._id || rule.id}`)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: 'rule', id: rule._id || rule.id, name: rule.name })}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <Badge color={getOfferTypeColor(rule.offerType)} variant="soft">
                            {rule.offerType?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-12 text-gray-500">Loading...</div>
                ) : categoryDiscounts.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No category discounts found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryDiscounts.map((discount) => (
                      <div
                        key={discount._id || discount.id}
                        className="bg-gradient-to-br from-white to-blue-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                              <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">
                                {discount.customerCategory?.replace(/_/g, ' ')}
                              </h3>
                              <p className="text-sm text-gray-500">{discount.brandCode === '*' ? 'All Brands' : discount.brandCode}</p>
                            </div>
                          </div>
                          <Badge color={discount.isActive ? 'green' : 'gray'} variant="soft">
                            {discount.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Percent className="h-5 w-5 text-blue-600" />
                            <span className="text-2xl font-bold text-gray-900">{discount.discountPercent}%</span>
                            <span className="text-sm text-gray-500">discount</span>
                          </div>
                          {discount.maxDiscount && (
                            <div className="text-sm text-gray-600">
                              Max discount: <strong>₹{discount.maxDiscount}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'coupons' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-12 text-gray-500">Loading...</div>
                ) : filteredCoupons.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No coupons found</p>
                    <Button
                      onClick={() => router.push('/admin/coupon-entry')}
                      className="mt-4"
                      icon={<Plus className="h-4 w-4" />}
                    >
                      Create First Coupon
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCoupons.map((coupon) => (
                      <div
                        key={coupon._id || coupon.id}
                        className="bg-gradient-to-br from-white to-green-50 rounded-xl border-2 border-green-200 hover:border-green-400 hover:shadow-lg transition-all p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Ticket className="h-5 w-5 text-green-600" />
                              <h3 className="font-bold text-lg text-gray-900 font-mono">{coupon.code}</h3>
                            </div>
                            {coupon.description && (
                              <p className="text-sm text-gray-600">{coupon.description}</p>
                            )}
                          </div>
                          <Badge color={coupon.isActive ? 'green' : 'gray'} variant="soft">
                            {coupon.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2">
                            {coupon.discountType === 'PERCENTAGE' ? (
                              <>
                                <Percent className="h-5 w-5 text-green-600" />
                                <span className="text-xl font-bold text-gray-900">{coupon.discountValue}%</span>
                                <span className="text-sm text-gray-500">off</span>
                              </>
                            ) : (
                              <>
                                <DollarSign className="h-5 w-5 text-green-600" />
                                <span className="text-xl font-bold text-gray-900">₹{coupon.discountValue}</span>
                                <span className="text-sm text-gray-500">off</span>
                              </>
                            )}
                          </div>
                          {coupon.minCartValue && (
                            <div className="text-sm text-gray-600">
                              Min cart: <strong>₹{coupon.minCartValue}</strong>
                            </div>
                          )}
                          {coupon.maxDiscount && (
                            <div className="text-sm text-gray-600">
                              Max discount: <strong>₹{coupon.maxDiscount}</strong>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="flex gap-2">
                            <button
                              onClick={() => router.push(`/admin/coupon-entry?id=${coupon._id || coupon.id}`)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: 'coupon', id: coupon._id || coupon.id, name: coupon.code })}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'simulation' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Play className="h-6 w-6 text-blue-600" />
                    Offer Engine Simulation
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Test how offers are calculated with sample cart data. This helps validate rules before going live.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Frame Input */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Frame Details</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                        <input
                          type="text"
                          value={simulationCart.frame.brand}
                          onChange={(e) => setSimulationCart({
                            ...simulationCart,
                            frame: { ...simulationCart.frame, brand: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="LENSTRACK"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sub Category</label>
                        <input
                          type="text"
                          value={simulationCart.frame.subCategory || ''}
                          onChange={(e) => setSimulationCart({
                            ...simulationCart,
                            frame: { ...simulationCart.frame, subCategory: e.target.value || null }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="ADVANCED"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹)</label>
                        <input
                          type="number"
                          value={simulationCart.frame.mrp}
                          onChange={(e) => setSimulationCart({
                            ...simulationCart,
                            frame: { ...simulationCart.frame, mrp: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Lens Input */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900">Lens Details</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IT Code</label>
                        <input
                          type="text"
                          value={simulationCart.lens.itCode}
                          onChange={(e) => setSimulationCart({
                            ...simulationCart,
                            lens: { ...simulationCart.lens, itCode: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="D360ASV"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand Line</label>
                        <input
                          type="text"
                          value={simulationCart.lens.brandLine}
                          onChange={(e) => setSimulationCart({
                            ...simulationCart,
                            lens: { ...simulationCart.lens, brandLine: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          placeholder="DIGI360_ADVANCED"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                        <input
                          type="number"
                          value={simulationCart.lens.price}
                          onChange={(e) => setSimulationCart({
                            ...simulationCart,
                            lens: { ...simulationCart.lens, price: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="yopoEligible"
                          checked={simulationCart.lens.yopoEligible}
                          onChange={(e) => setSimulationCart({
                            ...simulationCart,
                            lens: { ...simulationCart.lens, yopoEligible: e.target.checked }
                          })}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="yopoEligible" className="text-sm font-medium text-gray-700">
                          YOPO Eligible
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Customer Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Category</label>
                      <select
                        value={simulationCart.customerCategory || ''}
                        onChange={(e) => setSimulationCart({
                          ...simulationCart,
                          customerCategory: e.target.value || null
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">None</option>
                        <option value="STUDENT">Student</option>
                        <option value="DOCTOR">Doctor</option>
                        <option value="TEACHER">Teacher</option>
                        <option value="ARMED_FORCES">Armed Forces</option>
                        <option value="SENIOR_CITIZEN">Senior Citizen</option>
                        <option value="CORPORATE">Corporate</option>
                      </select>
                    </div>

                    {/* Coupon Code */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                      <input
                        type="text"
                        value={simulationCart.couponCode || ''}
                        onChange={(e) => setSimulationCart({
                          ...simulationCart,
                          couponCode: e.target.value || null
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="WELCOME10"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={runSimulation}
                        disabled={simulationLoading}
                        icon={simulationLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                        className="w-full md:w-auto"
                      >
                        {simulationLoading ? 'Calculating...' : 'Run Offer Engine'}
                      </Button>
                      
                      {/* Show applicable offers count */}
                      {offerRules.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold">{offerRules.filter(r => r.isActive).length}</span> active rules, 
                          <span className="font-semibold text-indigo-600 ml-1">{applicableOffers.length}</span> applicable
                        </div>
                      )}
                    </div>

                    {/* Show Applicable Offers */}
                    {applicableOffers.length > 0 && (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          Applicable Offer Rules ({applicableOffers.length})
                        </h5>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {applicableOffers
                            .sort((a, b) => (a.priority || 100) - (b.priority || 100))
                            .map((rule) => (
                            <div key={rule.id || rule._id} className="bg-white rounded p-2 border border-blue-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getOfferTypeIcon(rule.offerType)}
                                  <span className="text-sm font-medium text-gray-900">{rule.name || rule.code}</span>
                                  <Badge color={getOfferTypeColor(rule.offerType)} variant="soft" className="text-xs">
                                    {rule.offerType}
                                  </Badge>
                                </div>
                                <span className="text-xs text-gray-500">Priority: {rule.priority || 100}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          Offers are applied in priority order. The highest priority (lowest number) offer will be applied first.
                        </p>
                      </div>
                    )}

                    {applicableOffers.length === 0 && offerRules.length > 0 && (
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-semibold text-yellow-800">No applicable offers</span>
                        </div>
                        <p className="text-xs text-yellow-700 mt-1">
                          No active offer rules match your current cart configuration. Adjust the frame/lens details or create a new offer rule.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Simulation Results */}
                {simulationResult && (
                  <div className="space-y-4">
                    {simulationResult.error ? (
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                        <p className="text-red-800 font-semibold">Error: {simulationResult.error}</p>
                      </div>
                    ) : (
                      <>
                        {/* Applied Offers Display */}
                        {simulationResult.appliedOffers && simulationResult.appliedOffers.length > 0 ? (
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              Offers Applied ({simulationResult.appliedOffers.length})
                            </h4>
                            <div className="space-y-2">
                              {simulationResult.appliedOffers.map((offer, index) => (
                                <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {getOfferTypeIcon(offer.offerType)}
                                      <div>
                                        <div className="font-semibold text-gray-900">{offer.description || offer.ruleCode}</div>
                                        {offer.ruleCode && (
                                          <div className="text-sm text-gray-500">Code: {offer.ruleCode}</div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-green-600">
                                        -₹{offer.savings?.toLocaleString('en-IN') || '0'}
                                      </div>
                                      <Badge color={getOfferTypeColor(offer.offerType)} variant="soft" className="mt-1">
                                        {offer.offerType || 'OFFER'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-yellow-600" />
                              <p className="text-yellow-800 font-semibold">No offers applied</p>
                            </div>
                            <p className="text-sm text-yellow-700 mt-2">
                              No active offer rules match this cart configuration. Create an offer rule that matches:
                            </p>
                            <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                              <li>Frame Brand: {simulationCart.frame.brand}</li>
                              {simulationCart.frame.subCategory && (
                                <li>Frame Sub Category: {simulationCart.frame.subCategory}</li>
                              )}
                              <li>Lens Brand Line: {simulationCart.lens.brandLine}</li>
                              {simulationCart.lens.yopoEligible && (
                                <li>YOPO Eligible: Yes</li>
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Price Breakdown */}
                        <OfferBreakdownPanel result={simulationResult} />

                        {/* Upsell Banner */}
                        {simulationResult.upsell && (
                          <UpsellBanner upsell={simulationResult.upsell} />
                        )}

                        {/* Debug Info (for development) */}
                        {process.env.NODE_ENV === 'development' && (
                          <details className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <summary className="cursor-pointer font-semibold text-gray-700">Debug Info</summary>
                            <pre className="mt-2 text-xs overflow-auto bg-white p-4 rounded border">
                              {JSON.stringify(simulationResult, null, 2)}
                            </pre>
                          </details>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Confirm Delete"
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(deleteConfirm.type, deleteConfirm.id)}
              >
                Delete
              </Button>
            </>
          }
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Are you sure?</p>
              <p className="text-sm text-gray-600 mt-1">
                This will permanently delete "{deleteConfirm?.name}". This action cannot be undone.
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}

