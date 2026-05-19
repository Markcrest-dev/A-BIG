import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const { currentUser } = useAuth();
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage and merge guest cart when user logs in
  useEffect(() => {
    if (currentUser) {
      // 1. Load user's saved cart
      let userCart = [];
      const savedUserCart = localStorage.getItem(`cart_${currentUser.uid}`);
      if (savedUserCart) {
        try {
          userCart = JSON.parse(savedUserCart);
        } catch (e) {
          console.error('Failed to parse user cart items', e);
        }
      }

      // 2. Load guest's saved cart and merge
      const savedGuestCart = localStorage.getItem('cart_guest');
      if (savedGuestCart) {
        try {
          const guestCart = JSON.parse(savedGuestCart);
          if (guestCart && guestCart.length > 0) {
            // Merge guest cart items into user cart
            const mergedCart = [...userCart];
            guestCart.forEach(guestItem => {
              const guestKey = guestItem.cartItemId || guestItem.id;
              const existingIdx = mergedCart.findIndex(item => (item.cartItemId || item.id) === guestKey);
              if (existingIdx > -1) {
                // If item exists in user cart, add quantities up to max stock
                const maxStock = guestItem.stock !== undefined ? guestItem.stock : 999;
                mergedCart[existingIdx].quantity = Math.min(
                  mergedCart[existingIdx].quantity + guestItem.quantity,
                  maxStock
                );
              } else {
                mergedCart.push(guestItem);
              }
            });
            userCart = mergedCart;
            // Clear guest cart from localStorage
            localStorage.removeItem('cart_guest');
          }
        } catch (e) {
          console.error('Failed to parse guest cart items on merge', e);
        }
      }

      setCartItems(userCart);
    } else {
      // Load guest cart
      const savedGuestCart = localStorage.getItem('cart_guest');
      if (savedGuestCart) {
        try {
          setCartItems(JSON.parse(savedGuestCart));
        } catch (e) {
          console.error('Failed to parse guest cart items', e);
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
    }
  }, [currentUser]);

  // Save cart to localStorage when cartItems change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(cartItems));
    } else {
      localStorage.setItem('cart_guest', JSON.stringify(cartItems));
    }
  }, [cartItems, currentUser]);

  const addToCart = (product, selectedVariation = null) => {
    const variation = selectedVariation || product.selectedVariation || null;
    const cartItemId = variation ? `${product.id}_${variation.name}` : product.id;
    const maxStock = variation ? variation.stock : (product.stock !== undefined ? product.stock : 999);

    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => (item.cartItemId || item.id) === cartItemId);
      if (existing) {
        if (existing.quantity >= maxStock) {
          return prevItems;
        }
        return prevItems.map((item) =>
          (item.cartItemId || item.id) === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      if (maxStock <= 0) return prevItems;

      const newCartItem = {
        ...product,
        cartItemId,
        selectedVariation: variation,
        stock: maxStock
      };

      if (variation && variation.mediaUrl) {
        newCartItem.mediaUrl = variation.mediaUrl;
        newCartItem.mediaType = variation.mediaType || 'image';
      }

      return [...prevItems, { ...newCartItem, quantity: 1 }];
    });
  };

  const removeFromCart = (cartItemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => (item.cartItemId || item.id) !== cartItemId));
  };

  const updateQuantity = (cartItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if ((item.cartItemId || item.id) === cartItemId) {
          const maxStock = item.selectedVariation ? item.selectedVariation.stock : (item.stock !== undefined ? item.stock : 999);
          const allowedQty = Math.min(quantity, maxStock);
          return { ...item, quantity: allowedQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.price) || 0) * item.quantity, 0);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
