// contexts/CartContext.js
// Cart Context - Holds cart items, totals, offerEngineResult

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { offerService } from '../services/offers';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [frame, setFrame] = useState(null);
  const [lens, setLens] = useState(null);
  const [customerCategory, setCustomerCategory] = useState(null);
  const [couponCode, setCouponCode] = useState(null);
  const [offerEngineResult, setOfferEngineResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-fetch backend /calculate on updates
  const calculateOffers = useCallback(async () => {
    if (!frame || !lens) {
      setOfferEngineResult(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await offerService.calculate({
        frame,
        lens,
        customerCategory,
        couponCode
      });

      setOfferEngineResult(result);
    } catch (err) {
      console.error('Offer calculation error:', err);
      setError(err.message || 'Unable to calculate offer. Try again.');
      setOfferEngineResult(null);
    } finally {
      setLoading(false);
    }
  }, [frame, lens, customerCategory, couponCode]);

  // Auto-calculate when dependencies change
  useEffect(() => {
    calculateOffers();
  }, [calculateOffers]);

  const addCartItem = useCallback((item) => {
    setCartItems(prev => [...prev, item]);
  }, []);

  const removeCartItem = useCallback((itemId) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateCartItem = useCallback((itemId, updates) => {
    setCartItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setFrame(null);
    setLens(null);
    setCustomerCategory(null);
    setCouponCode(null);
    setOfferEngineResult(null);
    setError(null);
  }, []);

  const value = {
    // Cart items
    cartItems,
    addCartItem,
    removeCartItem,
    updateCartItem,
    clearCart,
    
    // Frame & Lens
    frame,
    setFrame,
    lens,
    setLens,
    
    // Customer & Coupon
    customerCategory,
    setCustomerCategory,
    couponCode,
    setCouponCode,
    
    // Offer Engine Result
    offerEngineResult,
    loading,
    error,
    
    // Manual recalculation
    recalculateOffers: calculateOffers
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}

