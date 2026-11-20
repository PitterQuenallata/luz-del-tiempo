import React, { useState, useMemo } from 'react';
import {
  Search,
  Star,
  ShoppingCart,
  Eye,
  Check,
  RotateCcw,
  Sparkles,
  Tag,
  ArrowUpDown,
} from 'lucide-react';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Input } from '../../../shared/components/ui/input';
import { Product } from '../types/ecommerce';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

interface EcommerceShopTabProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export const EcommerceShopTab: React.FC<EcommerceShopTabProps> = ({
  products,
  onAddToCart,
  onSelectProduct,
}) => {
  const { play } = useSound();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'discount'>('newest');
  const [maxPrice, setMaxPrice] = useState<number>(350);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);

  const categories = ['Todas', 'Electrónica', 'Libros', 'Hardware', 'Moda', 'Audio'];

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase());

        const matchesCat = selectedCategory === 'Todas' || p.category === selectedCategory;
        const matchesPrice = p.price <= maxPrice;
        const matchesStock = !onlyInStock || p.inStock;

        return matchesSearch && matchesCat && matchesPrice && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'discount') return (b.discountPercent || 0) - (a.discountPercent || 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, search, selectedCategory, sortBy, maxPrice, onlyInStock]);

  const handleResetFilters = () => {
    play('pop');
    setSearch('');
    setSelectedCategory('Todas');
    setSortBy('newest');
    setMaxPrice(350);
    setOnlyInStock(false);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, categoría o palabras clave..."
            className="pl-10 text-xs h-9 bg-background"
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
          <select
            value={sortBy}
            onChange={(e) => {
              play('click');
              setSortBy(e.target.value as any);
            }}
            className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
          >
            <option value="newest">Más recientes</option>
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
            <option value="discount">Mayor Descuento</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Filters (3 cols) */}
        <Card className="lg:col-span-3 border-border sticky top-24">
          <CardContent className="p-5 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Filtros de Tienda</h3>
              <Button
                variant="ghost"
                size="iconSm"
                soundType="click"
                onClick={handleResetFilters}
                title="Restablecer filtros"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Category Filter */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-foreground block">Categorías</span>
              <div className="space-y-1">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const count =
                    cat === 'Todas'
                      ? products.length
                      : products.filter((p) => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        play('tab');
                        setSelectedCategory(cat);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left',
                        isSelected
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      )}
                    >
                      <span>{cat}</span>
                      <span className="font-mono text-[11px] tabular-nums">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2.5 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Precio Máximo</span>
                <span className="font-mono font-bold text-foreground tabular-nums">${maxPrice} USD</span>
              </div>
              <input
                type="range"
                min="20"
                max="350"
                step="5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>$20</span>
                <span>$350</span>
              </div>
            </div>

            {/* Stock Availability Toggle */}
            <div className="pt-4 border-t border-border/50">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-medium text-foreground">Solo en Stock</span>
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => {
                    play('toggle');
                    setOnlyInStock(e.target.checked);
                  }}
                  className="rounded accent-primary h-4 w-4 cursor-pointer"
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Product Cards Grid (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Mostrando <strong className="text-foreground">{filteredProducts.length}</strong> de {products.length} productos
            </span>
            {selectedCategory !== 'Todas' && (
              <Badge variant="outline" className="font-mono text-[10px]">
                Filtro: {selectedCategory}
              </Badge>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <Card className="border-border p-12 text-center">
              <CardContent className="space-y-3">
                <div className="h-12 w-12 rounded-full bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
                  <Search className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">No se encontraron productos</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Intenta cambiar los términos de búsqueda o restablecer los filtros de precio y categoría.
                </p>
                <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
                  Restablecer Filtros
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="group flex flex-col justify-between border-border overflow-hidden hover:border-foreground/20 hover:shadow-md transition-all duration-200"
                >
                  {/* Image Container with Discount Tag */}
                  <div className="relative aspect-4/3 w-full bg-secondary/30 overflow-hidden cursor-pointer" onClick={() => onSelectProduct(product)}>
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.discountPercent && product.discountPercent > 0 && (
                      <div className="absolute top-2.5 left-2.5 bg-red-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                        -{product.discountPercent}%
                      </div>
                    )}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-2xs flex items-center justify-center">
                        <Badge variant="secondary" className="font-mono text-xs">
                          Agotado
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                          {product.category}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-amber-500 font-semibold">
                          <Star className="h-3 w-3 fill-amber-500" />
                          <span>{product.rating}</span>
                          <span className="text-muted-foreground text-[10px]">({product.reviewsCount})</span>
                        </div>
                      </div>

                      <h4
                        onClick={() => onSelectProduct(product)}
                        className="text-xs font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer line-clamp-1"
                        title={product.title}
                      >
                        {product.title}
                      </h4>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Price and Cart Button */}
                    <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono font-bold text-base text-foreground tabular-nums">
                            ${product.price}
                          </span>
                          {product.originalPrice && (
                            <span className="font-mono text-xs text-muted-foreground line-through tabular-nums">
                              ${product.originalPrice}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {product.inStock ? `${product.stockQty} en stock` : 'Sin unidades'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="iconSm"
                          soundType="click"
                          onClick={() => {
                            play('click');
                            onSelectProduct(product);
                          }}
                          title="Ver ficha de producto"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant={product.inStock ? 'default' : 'secondary'}
                          size="sm"
                          disabled={!product.inStock}
                          soundType="pop"
                          onClick={() => {
                            onAddToCart(product);
                            pillToast.success('Añadido al Carrito', `${product.title} se añadió a tu pedido.`);
                          }}
                          className="h-8 text-xs px-2.5 gap-1.5"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Añadir</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
