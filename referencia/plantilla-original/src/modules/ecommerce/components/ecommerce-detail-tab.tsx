import React, { useState } from 'react';
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  CreditCard,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  Minus,
  Plus,
  Share2,
} from 'lucide-react';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Product } from '../types/ecommerce';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

interface EcommerceDetailTabProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number, color?: string, size?: string) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

export const EcommerceDetailTab: React.FC<EcommerceDetailTabProps> = ({
  product,
  onBack,
  onAddToCart,
  onBuyNow,
}) => {
  const { play } = useSound();
  const [activeImage, setActiveImage] = useState<string>(product.image);
  const [selectedColor, setSelectedColor] = useState<string>(product.colors?.[0] || '');
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  const gallery = product.images && product.images.length > 0 ? product.images : [product.image];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          soundType="click"
          onClick={() => {
            play('click');
            onBack();
          }}
          className="text-xs gap-1.5 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Catálogo
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="iconSm"
            soundType="click"
            onClick={() => {
              play('click');
              pillToast.info('Enlace de Producto Copiado', 'Listo para compartir con tu equipo.');
            }}
            title="Compartir enlace"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Product Card (Gallery + Overview) */}
      <Card className="border-border overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Gallery (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-secondary/30 border border-border">
                <img
                  src={activeImage}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                {product.discountPercent && product.discountPercent > 0 && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg shadow-xs">
                    -{product.discountPercent}% OFF
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {gallery.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        play('click');
                        setActiveImage(img);
                      }}
                      className={cn(
                        'h-16 w-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer',
                        activeImage === img
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border/60 opacity-70 hover:opacity-100'
                      )}
                    >
                      <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {product.category}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">{product.sku}</span>
                  <Badge
                    variant={product.inStock ? 'default' : 'secondary'}
                    className={cn(
                      'text-[10px] font-mono ml-auto',
                      product.inStock && 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    )}
                  >
                    {product.inStock ? 'En Stock' : 'Agotado'}
                  </Badge>
                </div>

                <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {product.title}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-4 w-4',
                          i < Math.floor(product.rating)
                            ? 'fill-amber-500'
                            : 'text-muted-foreground/30'
                        )}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
                    {product.rating}
                  </span>
                  <span className="text-xs text-muted-foreground">({product.reviewsCount} opiniones verificadas)</span>
                </div>
              </div>

              {/* Pricing Box */}
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border flex items-baseline justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-3xl font-bold text-foreground tabular-nums">
                      ${product.price}.00
                    </span>
                    {product.originalPrice && (
                      <span className="font-mono text-sm text-muted-foreground line-through tabular-nums">
                        ${product.originalPrice}.00
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Impuestos incluidos. Envío calculado en el checkout.
                  </span>
                </div>

                {product.originalPrice && (
                  <Badge variant="outline" className="font-mono text-xs text-emerald-500 border-emerald-500/20 bg-emerald-500/10">
                    Ahorras ${(product.originalPrice - product.price).toFixed(2)}
                  </Badge>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>

              {/* Variations: Colors & Sizes */}
              <div className="space-y-4 pt-2 border-t border-border/50">
                {/* Color Selector */}
                {product.colors && product.colors.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-foreground block">Color Seleccionado</span>
                    <div className="flex items-center gap-2">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            play('click');
                            setSelectedColor(color);
                          }}
                          className={cn(
                            'h-7 w-7 rounded-full border-2 flex items-center justify-center transition-transform cursor-pointer',
                            selectedColor === color
                              ? 'border-primary scale-110 shadow-xs'
                              : 'border-transparent hover:scale-105'
                          )}
                          style={{ backgroundColor: color }}
                        >
                          {selectedColor === color && (
                            <Check className="h-3.5 w-3.5 text-white mix-blend-difference" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size / Variant Selector */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-foreground block">Variante / Edición</span>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            play('tab');
                            setSelectedSize(sz);
                          }}
                          className={cn(
                            'px-3.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer',
                            selectedSize === sz
                              ? 'bg-foreground text-background font-semibold border-foreground shadow-xs'
                              : 'border-border text-muted-foreground hover:bg-muted/50'
                          )}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Counter + Action Buttons */}
              <div className="pt-4 border-t border-border/50 space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-foreground">Cantidad:</span>
                  <div className="flex items-center border border-border rounded-xl overflow-hidden bg-background">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => {
                        play('click');
                        setQuantity((q) => Math.max(1, q - 1));
                      }}
                      className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-mono text-xs font-bold px-3 tabular-nums text-foreground">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        play('click');
                        setQuantity((q) => q + 1);
                      }}
                      className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({product.stockQty} disponibles en almacén)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    variant="outline"
                    soundType="pop"
                    disabled={!product.inStock}
                    onClick={() => {
                      onAddToCart(product, quantity, selectedColor, selectedSize);
                      pillToast.success(
                        'Añadido al Carrito',
                        `${quantity}x ${product.title} añadido a tu orden.`
                      );
                    }}
                    className="w-full sm:w-1/2 text-xs h-10 gap-2 justify-center"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Añadir al Carrito
                  </Button>

                  <Button
                    variant="default"
                    soundType="click"
                    disabled={!product.inStock}
                    onClick={() => {
                      onAddToCart(product, quantity, selectedColor, selectedSize);
                      onBuyNow(product, quantity);
                    }}
                    className="w-full sm:w-1/2 text-xs h-10 gap-2 justify-center"
                  >
                    <CreditCard className="h-4 w-4" />
                    Comprar Ahora
                  </Button>
                </div>
              </div>

              {/* Guarantees Strip */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary shrink-0" />
                  <span>Envío Exprés 24/48h</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Garantía Oficial 2 Años</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>Devolución Gratis 30 Días</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Specs, Details & Reviews */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-5">
            <button
              type="button"
              onClick={() => {
                play('tab');
                setActiveTab('desc');
              }}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'desc'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Descripción Completa
            </button>
            <button
              type="button"
              onClick={() => {
                play('tab');
                setActiveTab('specs');
              }}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'specs'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Especificaciones Técnicas
            </button>
            <button
              type="button"
              onClick={() => {
                play('tab');
                setActiveTab('reviews');
              }}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'reviews'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Reseñas ({product.reviewsCount})
            </button>
          </div>

          {activeTab === 'desc' && (
            <div className="space-y-4 text-xs text-muted-foreground leading-relaxed animate-fade-in">
              <p>
                {product.description} Este producto ha sido verificado y certificado bajo los estándares más exigentes de control de calidad, asegurando una vida útil prolongada y compatibilidad nativa en infraestructuras comerciales y personales.
              </p>
              {product.features && (
                <div className="pt-2">
                  <h4 className="font-semibold text-foreground text-xs mb-2">Características Principales:</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2 text-foreground">
                        <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="overflow-x-auto animate-fade-in text-xs">
              <table className="w-full text-left">
                <tbody className="divide-y divide-border/50">
                  <tr className="py-2.5">
                    <td className="py-2.5 font-medium text-muted-foreground w-1/3">Identificador SKU</td>
                    <td className="py-2.5 font-mono text-foreground">{product.sku}</td>
                  </tr>
                  <tr className="py-2.5">
                    <td className="py-2.5 font-medium text-muted-foreground">Categoría Principal</td>
                    <td className="py-2.5 text-foreground">{product.category}</td>
                  </tr>
                  <tr className="py-2.5">
                    <td className="py-2.5 font-medium text-muted-foreground">Disponibilidad en Almacén</td>
                    <td className="py-2.5 font-mono text-foreground">{product.stockQty} unidades físicas</td>
                  </tr>
                  <tr className="py-2.5">
                    <td className="py-2.5 font-medium text-muted-foreground">Certificación</td>
                    <td className="py-2.5 text-foreground">CE, FCC, RoHS, ISO 9001</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border flex items-center justify-between">
                <div>
                  <div className="font-mono text-2xl font-bold text-foreground tabular-nums">4.8 / 5.0</div>
                  <span className="text-[11px] text-muted-foreground">Basado en {product.reviewsCount} evaluaciones</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  soundType="click"
                  onClick={() => pillToast.info('Formulario de Reseña', 'Abriendo editor de comentarios.')}
                  className="text-xs"
                >
                  Escribir Reseña
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                {[
                  { name: 'Martín Paredes', date: 'Hace 3 días', rating: 5, comment: 'Excelente calidad de construcción. Los materiales superaron mis expectativas y el envío llegó al día siguiente.' },
                  { name: 'Elena Quispe', date: 'Hace 1 semana', rating: 4, comment: 'Muy buen rendimiento en entornos de trabajo continuo. 100% recomendado.' },
                ].map((rev, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-border/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{rev.name}</span>
                      <span className="text-[10px] text-muted-foreground">{rev.date}</span>
                    </div>
                    <div className="flex text-amber-500">
                      {Array.from({ length: rev.rating }).map((_, r) => (
                        <Star key={r} className="h-3 w-3 fill-amber-500" />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
