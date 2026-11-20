import React, { useState } from 'react';
import {
  ShoppingBag,
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Plus,
  Eye,
  CheckCircle2,
  BadgePercent,
  Truck,
} from 'lucide-react';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { initialProducts, initialGateways, initialTransactions, initialPerformances } from '../data/ecommerce-data';
import { Product, CartItem, PaymentGateway, RecentTransaction, ProductPerformance } from '../types/ecommerce';
import { EcommerceDashboardTab } from '../components/ecommerce-dashboard-tab';
import { EcommerceShopTab } from '../components/ecommerce-shop-tab';
import { EcommerceListTab } from '../components/ecommerce-list-tab';
import { EcommerceDetailTab } from '../components/ecommerce-detail-tab';
import { EcommerceCheckoutTab } from '../components/ecommerce-checkout-tab';
import { EcommerceAddTab } from '../components/ecommerce-add-tab';
import { EcommerceOrdersTab } from '../components/ecommerce-orders-tab';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

export type EcommerceSubTab = 'dashboard' | 'shop' | 'list' | 'detail' | 'checkout' | 'orders' | 'add';

export const EcommercePage: React.FC = () => {
  const { play } = useSound();
  const [activeTab, setActiveTab] = useState<EcommerceSubTab>('dashboard');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product>(initialProducts[0]);
  const [cart, setCart] = useState<CartItem[]>([
    { product: initialProducts[0], quantity: 1, selectedColor: initialProducts[0].colors?.[0] },
    { product: initialProducts[1], quantity: 2, selectedSize: 'Físico (Tapa Dura)' },
  ]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity: number = 1, color?: string, size?: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedColor: color, selectedSize: size }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Product Selection
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveTab('detail');
  };

  // Add Product
  const handleAddProduct = (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
    setActiveTab('list');
  };

  // Delete Product
  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Cart total & item count
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const subTabs: {
    id: EcommerceSubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'shop', label: 'Catálogo (Shop)', icon: Store },
    { id: 'list', label: 'Gestión de Productos', icon: Package },
    { id: 'detail', label: 'Ficha de Detalle', icon: Eye },
    { id: 'checkout', label: 'Checkout', icon: ShoppingCart, badge: cartItemsCount > 0 ? String(cartItemsCount) : undefined },
    { id: 'orders', label: 'Progreso de Pedidos (Delivery)', icon: Truck, badge: 'Live' },
    { id: 'add', label: 'Nuevo Producto', icon: Plus },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-mono">
          <span>Módulos Comerciales</span>
          <span>/</span>
          <span className="text-foreground">eCommerce Suite</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Módulo de Comercio Electrónico
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              Estructura integral adaptada de la plantilla Modernize: métricas de facturación, catálogo interactivo con filtros, inventario de productos, ficha con selección de variantes y proceso de pago multi-paso.
            </p>
          </div>

          {/* Cart Indicator / CTA */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              soundType="click"
              onClick={() => {
                play('tab');
                setActiveTab('checkout');
              }}
              className="text-xs h-9 px-3.5 gap-2 border-border/80 hover:border-primary/40"
            >
              <ShoppingCart className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">
                ${cartTotal.toFixed(2)}
              </span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-white font-bold tabular-nums">
                {cartItemsCount}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Segmented Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-secondary/50 border border-border overflow-x-auto">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                play('tab');
                setActiveTab(tab.id as EcommerceSubTab);
              }}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
                isActive
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={cn(
                    'font-mono text-[10px] px-1.5 py-0.2 rounded-full tabular-nums',
                    isActive ? 'bg-primary text-white font-bold' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'dashboard' && (
        <EcommerceDashboardTab
          gateways={initialGateways}
          transactions={initialTransactions}
          performances={initialPerformances}
          onNavigateToShop={() => setActiveTab('shop')}
          onNavigateToList={() => setActiveTab('list')}
        />
      )}

      {activeTab === 'shop' && (
        <EcommerceShopTab
          products={products}
          onAddToCart={handleAddToCart}
          onSelectProduct={handleSelectProduct}
        />
      )}

      {activeTab === 'list' && (
        <EcommerceListTab
          products={products}
          onSelectProduct={handleSelectProduct}
          onNavigateToAdd={() => setActiveTab('add')}
          onDeleteProduct={handleDeleteProduct}
        />
      )}

      {activeTab === 'detail' && (
        <EcommerceDetailTab
          product={selectedProduct}
          onBack={() => setActiveTab('shop')}
          onAddToCart={handleAddToCart}
          onBuyNow={(prod, qty) => {
            handleAddToCart(prod, qty);
            setActiveTab('checkout');
          }}
        />
      )}

      {activeTab === 'checkout' && (
        <EcommerceCheckoutTab
          cart={cart}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          onContinueShopping={() => setActiveTab('shop')}
          onTrackOrder={() => setActiveTab('orders')}
        />
      )}

      {activeTab === 'orders' && (
        <EcommerceOrdersTab />
      )}

      {activeTab === 'add' && (
        <EcommerceAddTab
          onAddProduct={handleAddProduct}
          onCancel={() => setActiveTab('list')}
        />
      )}
    </div>
  );
};
