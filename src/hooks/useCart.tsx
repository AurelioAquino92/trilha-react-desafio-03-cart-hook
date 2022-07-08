import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (!storagedCart) return []
    
    return JSON.parse(storagedCart);
  });

  useEffect(() => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
  }, [cart])

  const addProduct = async (productId: number) => {
    try {
      if (cart.find(item => item.id === productId)) {
        updateProductAmount({productId: productId, amount: 1})
      } else {
        await api.get('/products/' + String(productId))
        .then(res => {
          if (res.status === 200) {
            setCart([...cart, {...res.data, amount: 1}])
          } 
        })
      }
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      setCart(cart.filter(item => item.id !== productId))
    } catch {
      toast.error('Erro ao remover produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const product = cart.find(item => item.id === productId)
      if (!product) return
      await api.get('/stock/' + String(productId))
        .then(res => {
          if (res.data.amount > product.amount || amount < 0) {
            setCart(cart.map(item => item.id === productId ? {...item, amount: item.amount + amount} : item))
          } else {
            toast.error('Quantidade solicitada fora de estoque')
          }
        })
    } catch {
      toast.error('Erro ao atualizar quantidade')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
