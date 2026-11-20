import React, { useState } from 'react';
import {
  Upload,
  Plus,
  Check,
  Package,
  DollarSign,
  Image as ImageIcon,
  Tag,
  Barcode,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Product } from '../types/ecommerce';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

interface EcommerceAddTabProps {
  onAddProduct: (product: Product) => void;
  onCancel: () => void;
}

export const EcommerceAddTab: React.FC<EcommerceAddTabProps> = ({
  onAddProduct,
  onCancel,
}) => {
  const { play } = useSound();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electrónica');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(99);
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [sku, setSku] = useState(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
  const [stockQty, setStockQty] = useState<number>(50);
  const [status, setStatus] = useState<Product['status']>('published');
  const [selectedImage, setSelectedImage] = useState('/images/products/s11.jpg');

  const availableSampleImages = [
    '/images/products/s11.jpg',
    '/images/products/s1.jpg',
    '/images/products/s4.jpg',
    '/images/products/s5.jpg',
    '/images/products/s6.jpg',
    '/images/products/s7.jpg',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      play('alert');
      pillToast.error('Nombre Obligatorio', 'Debes ingresar un título para el producto.');
      return;
    }

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      title,
      category,
      price: Number(price),
      originalPrice: discountPercent > 0 ? Math.round(price * (1 + discountPercent / 100)) : undefined,
      discountPercent: Number(discountPercent),
      rating: 5.0,
      reviewsCount: 1,
      inStock: stockQty > 0,
      stockQty: Number(stockQty),
      sku,
      image: selectedImage,
      images: [selectedImage],
      description: description || 'Sin descripción detallada.',
      status,
      createdAt: new Date().toISOString().split('T')[0],
    };

    play('success');
    onAddProduct(newProduct);
    pillToast.success('Producto Publicado', `"${title}" ha sido añadido al inventario activo.`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          soundType="click"
          onClick={() => {
            play('click');
            onCancel();
          }}
          className="text-xs gap-1.5 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancelar y Volver
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            soundType="click"
            onClick={() => {
              play('click');
              setStatus('draft');
              pillToast.info('Borrador Guardado', 'Los cambios se guardaron localmente.');
            }}
            className="text-xs"
          >
            Guardar Borrador
          </Button>
          <Button type="submit" variant="default" size="sm" soundType="success" className="text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Publicar Producto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): General Info, Pricing, Media */}
        <div className="lg:col-span-8 space-y-6">
          {/* General Information Card */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold">Información General</CardTitle>
              <CardDescription className="text-xs">Nombre, descripción principal y taxonomía del artículo</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1.5">
                  Nombre del Producto <span className="text-red-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ej. Auriculares Inalámbricos Studio Pro"
                  className="text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-foreground block mb-1.5">Categoría Comercial</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
                  >
                    <option value="Electrónica">Electrónica</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Libros">Libros</option>
                    <option value="Moda">Moda</option>
                    <option value="Audio">Audio</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1.5">Código SKU Maestro</label>
                  <Input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-foreground block mb-1.5">Descripción Detallada</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Especifica las cualidades, certificaciones y materiales del producto..."
                  className="w-full p-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-hidden leading-relaxed resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Discounts Card */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold">Estructura de Precios & Descuentos</CardTitle>
              <CardDescription className="text-xs">Moneda base USD, márgenes y deducciones promocionales</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-foreground block mb-1.5">Precio de Venta ($ USD)</label>
                  <Input
                    type="number"
                    min="1"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-medium text-foreground block mb-1.5">Porcentaje de Descuento (%)</label>
                  <Input
                    type="number"
                    min="0"
                    max="90"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {discountPercent > 0 && (
                <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border flex items-center justify-between">
                  <span className="text-muted-foreground">Precio Original Tachado:</span>
                  <span className="font-mono font-semibold text-foreground">
                    ${Math.round(price * (1 + discountPercent / 100))}.00 USD
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media / Photo Picker Card */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold">Fotografía Principal de Catálogo</CardTitle>
              <CardDescription className="text-xs">Selecciona una imagen de la galería de muestra o sube un archivo</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {availableSampleImages.map((img) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => {
                      play('click');
                      setSelectedImage(img);
                    }}
                    className={cn(
                      'h-16 w-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer',
                      selectedImage === img
                        ? 'border-primary ring-2 ring-primary/20 scale-105'
                        : 'border-border opacity-70 hover:opacity-100'
                    )}
                  >
                    <img src={img} alt="sample" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Upload Dropzone Placeholder */}
              <div className="p-6 border-2 border-dashed border-border rounded-2xl text-center space-y-2 cursor-pointer hover:border-primary/50 transition-colors">
                <div className="h-10 w-10 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold text-foreground">
                  Arrastra y suelta imágenes adicionales en formato JPG o PNG
                </p>
                <span className="text-[11px] text-muted-foreground block">
                  Resolución recomendada: 1000x1000px, máximo 5 MB por archivo
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Status, Inventory */}
        <div className="lg:col-span-4 space-y-6">
          {/* Status Card */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold">Estado de Publicación</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div className="space-y-2">
                {[
                  { id: 'published', label: 'Publicado Inmediatamente', desc: 'Visible en la tienda pública' },
                  { id: 'draft', label: 'Borrador Privado', desc: 'Solo visible para el staff' },
                  { id: 'low_stock', label: 'Bajo Stock Forzado', desc: 'Muestra badge de advertencia' },
                ].map((st) => (
                  <label
                    key={st.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                      status === st.id ? 'border-primary bg-primary/5 text-foreground' : 'border-border text-muted-foreground hover:bg-muted/30'
                    )}
                  >
                    <input
                      type="radio"
                      name="status"
                      checked={status === st.id}
                      onChange={() => setStatus(st.id as any)}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <span className="font-semibold text-foreground block">{st.label}</span>
                      <span className="text-[11px] text-muted-foreground">{st.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Inventory Card */}
          <Card className="border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold">Control de Existencias</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-medium text-foreground block mb-1.5">Unidades Iniciales</label>
                <Input
                  type="number"
                  min="0"
                  value={stockQty}
                  onChange={(e) => setStockQty(Number(e.target.value))}
                  className="text-xs font-mono font-bold"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border text-[11px] text-muted-foreground leading-relaxed">
                El sistema enviará una alerta automática cuando el stock descienda por debajo de 15 unidades.
              </div>
            </CardContent>
          </Card>

          {/* Submit Action Block */}
          <div className="space-y-2">
            <Button type="submit" variant="default" className="w-full text-xs h-10 gap-2 justify-center">
              <Check className="h-4 w-4" />
              Confirmar y Crear Producto
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full text-xs justify-center"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};
