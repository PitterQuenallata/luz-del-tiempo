import React, { useState } from 'react';
import {
  ShoppingCart,
  MapPin,
  CreditCard,
  CheckCircle2,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Tag,
  Download,
  Truck,
} from 'lucide-react';
import { DeliveryProgress } from '@/components/ui/delivery-progress';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Input } from '../../../shared/components/ui/input';
import { CartItem } from '../types/ecommerce';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

interface EcommerceCheckoutTabProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onContinueShopping: () => void;
  onTrackOrder?: () => void;
}

export const EcommerceCheckoutTab: React.FC<EcommerceCheckoutTabProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onContinueShopping,
  onTrackOrder,
}) => {
  const { play } = useSound();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'applepay'>('card');

  // Form states
  const [fullName, setFullName] = useState('Mathew Anderson');
  const [email, setEmail] = useState('mathew.anderson@modernize.io');
  const [address, setAddress] = useState('Av. Arce 2415, Torre Titanium');
  const [city, setCity] = useState('La Paz');
  const [postalCode, setPostalCode] = useState('0000');

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = couponApplied ? subtotal * 0.15 : 0;
  const shippingCost = cart.length === 0 ? 0 : shippingMethod === 'express' ? 15 : 0;
  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === 'BLAKOR15') {
      play('success');
      setCouponApplied(true);
      pillToast.success('Cupón Aplicado', 'Se aplicó 15% de descuento a tu orden.');
    } else {
      play('alert');
      pillToast.error('Cupón Inválido', 'Prueba con el código BLAKOR15.');
    }
  };

  const handleCompleteOrder = () => {
    play('success');
    setStep(4);
    pillToast.success('¡Orden Confirmada con Éxito!', 'Recibo #ORD-83922 generado y enviado por email.');
  };

  const steps = [
    { num: 1, label: 'Carrito de Compras', icon: ShoppingCart },
    { num: 2, label: 'Dirección de Envío', icon: MapPin },
    { num: 3, label: 'Método de Pago', icon: CreditCard },
    { num: 4, label: 'Confirmación', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Stepper Header */}
      <Card className="border-border">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            {steps.map((st, i) => {
              const Icon = st.icon;
              const isActive = step === st.num;
              const isPast = step > st.num;
              return (
                <div key={st.num} className="flex-1 flex items-center">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all shrink-0',
                        isPast
                          ? 'bg-emerald-500 text-white'
                          : isActive
                          ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {isPast ? <CheckCircle2 className="h-4 w-4" /> : st.num}
                    </div>
                    <span
                      className={cn(
                        'text-xs hidden md:inline font-medium',
                        isActive ? 'text-foreground font-bold' : 'text-muted-foreground'
                      )}
                    >
                      {st.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-3 transition-colors hidden sm:block',
                        step > st.num ? 'bg-emerald-500' : 'bg-border'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* STEP 1: SHOPPING CART */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Cart Table (8 cols) */}
          <Card className="lg:col-span-8 border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Artículos en tu Pedido</CardTitle>
                  <CardDescription className="text-xs">Revisa las cantidades antes de continuar</CardDescription>
                </div>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    soundType="alert"
                    onClick={() => {
                      onClearCart();
                      pillToast.info('Carrito Vaciado', 'Se retiraron todos los productos.');
                    }}
                    className="text-xs text-muted-foreground hover:text-red-500"
                  >
                    Vaciar Carrito
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {cart.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">Tu carrito está actualmente vacío</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Explora el catálogo comercial y añade productos de hardware, libros o moda para procesar una compra.
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    soundType="click"
                    onClick={() => {
                      play('click');
                      onContinueShopping();
                    }}
                    className="text-xs"
                  >
                    Ir a la Tienda
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/50 text-xs">
                  {cart.map((item) => (
                    <div key={item.product.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.product.image}
                          alt={item.product.title}
                          className="h-14 w-14 rounded-xl object-cover border border-border shrink-0"
                        />
                        <div>
                          <h4 className="font-semibold text-foreground line-clamp-1">{item.product.title}</h4>
                          <span className="text-[11px] text-muted-foreground block">{item.product.category}</span>
                          <span className="font-mono text-xs font-bold text-foreground tabular-nums mt-0.5 block">
                            ${item.product.price}.00 c/u
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-border rounded-xl overflow-hidden bg-background">
                          <button
                            type="button"
                            onClick={() => {
                              play('click');
                              onUpdateQuantity(item.product.id, item.quantity - 1);
                            }}
                            className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-mono text-xs font-bold px-2.5 tabular-nums text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              play('click');
                              onUpdateQuantity(item.product.id, item.quantity + 1);
                            }}
                            className="h-7 w-7 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Item Total */}
                        <span className="font-mono font-bold text-sm text-foreground tabular-nums min-w-[70px] text-right">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => {
                            onRemoveItem(item.product.id);
                            pillToast.warning('Producto Retirado', `${item.product.title} fue eliminado del carrito.`);
                          }}
                          className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary (4 cols) */}
          <Card className="lg:col-span-4 border-border">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold">Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Cupón (BLAKOR15)"
                  className="text-xs h-8 uppercase font-mono"
                  disabled={couponApplied}
                />
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={couponApplied || !couponCode}
                  className="text-xs h-8 px-3"
                >
                  Aplicar
                </Button>
              </form>

              {couponApplied && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                  <Tag className="h-3.5 w-3.5" />
                  <span>Descuento del 15% aplicado</span>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-2 text-xs pt-2 border-t border-border/50">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} artículos)</span>
                  <span className="font-mono text-foreground tabular-nums">${subtotal.toFixed(2)}</span>
                </div>

                {couponApplied && (
                  <div className="flex justify-between text-emerald-500 font-medium">
                    <span>Descuento de Promoción</span>
                    <span className="font-mono tabular-nums">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-muted-foreground">
                  <span>Coste de Envío</span>
                  <span className="font-mono text-foreground tabular-nums">
                    {shippingCost === 0 ? 'Gratis' : `$${shippingCost}.00`}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-bold text-foreground pt-3 border-t border-border/50">
                  <span>Total Estimado</span>
                  <span className="font-mono text-base tabular-nums">${total.toFixed(2)} USD</span>
                </div>
              </div>

              <Button
                variant="default"
                soundType="click"
                disabled={cart.length === 0}
                onClick={() => {
                  play('click');
                  setStep(2);
                }}
                className="w-full text-xs h-10 gap-2 justify-center"
              >
                Continuar a Envío
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 2: SHIPPING ADDRESS */}
      {step === 2 && (
        <Card className="max-w-2xl mx-auto border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-semibold">Dirección de Entrega & Facturación</CardTitle>
            <CardDescription className="text-xs">Introduce los datos del destinatario para la logística</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-foreground block mb-1.5">Nombre Completo</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="text-xs" />
              </div>
              <div>
                <label className="font-medium text-foreground block mb-1.5">Correo Electrónico</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} className="text-xs" />
              </div>
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1.5">Dirección Física</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} className="text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-medium text-foreground block mb-1.5">Ciudad</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="text-xs" />
              </div>
              <div>
                <label className="font-medium text-foreground block mb-1.5">Código Postal</label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="text-xs font-mono" />
              </div>
            </div>

            {/* Shipping options */}
            <div className="space-y-2 pt-2">
              <span className="font-semibold text-foreground block">Modalidad de Envío</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    play('click');
                    setShippingMethod('standard');
                  }}
                  className={cn(
                    'p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1',
                    shippingMethod === 'standard'
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:bg-muted/30'
                  )}
                >
                  <div className="flex justify-between font-semibold">
                    <span>Estándar (3-5 días)</span>
                    <span className="text-emerald-500 font-mono">GRATIS</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Entrega a domicilio por correo certificado</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    play('click');
                    setShippingMethod('express');
                  }}
                  className={cn(
                    'p-3.5 rounded-2xl border text-left transition-all cursor-pointer space-y-1',
                    shippingMethod === 'express'
                      ? 'border-primary bg-primary/5 text-foreground'
                      : 'border-border text-muted-foreground hover:bg-muted/30'
                  )}
                >
                  <div className="flex justify-between font-semibold">
                    <span>Exprés Prioritario (24h)</span>
                    <span className="font-mono text-foreground">$15.00</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Despacho en el mismo día con courier privado</p>
                </button>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-border/50">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Atrás al Carrito
              </Button>
              <Button variant="default" size="sm" onClick={() => setStep(3)} className="text-xs gap-1.5">
                Continuar al Pago <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: PAYMENT METHOD */}
      {step === 3 && (
        <Card className="max-w-2xl mx-auto border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-sm font-semibold">Selección de Método de Pago</CardTitle>
            <CardDescription className="text-xs">Transacción cifrada con tokenización AES-256</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5 text-xs">
            <div className="space-y-3">
              {[
                { id: 'card', name: 'Tarjeta de Crédito / Débito (Stripe)', desc: 'Visa, Mastercard, American Express', icon: CreditCard },
                { id: 'applepay', name: 'Apple Pay / Google Wallet', desc: 'Pago instantáneo con autenticación biométrica', icon: ShieldCheck },
                { id: 'paypal', name: 'PayPal Commerce', desc: 'Pago protegido por cuenta PayPal', icon: ShoppingCart },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSel = paymentMethod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      play('click');
                      setPaymentMethod(opt.id as any);
                    }}
                    className={cn(
                      'w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer',
                      isSel ? 'border-primary bg-primary/5 text-foreground' : 'border-border hover:bg-muted/30 text-muted-foreground'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-muted text-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-foreground block">{opt.name}</span>
                        <span className="text-[11px] text-muted-foreground">{opt.desc}</span>
                      </div>
                    </div>
                    <div className={cn('h-4 w-4 rounded-full border flex items-center justify-center', isSel ? 'border-primary bg-primary text-white' : 'border-muted-foreground')}>
                      {isSel && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Total Payment Summary */}
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block">Monto Total a Autorizar</span>
                <span className="font-mono text-2xl font-bold text-foreground tabular-nums">
                  ${total.toFixed(2)} USD
                </span>
              </div>
              <Badge variant="outline" className="font-mono text-xs text-emerald-500 border-emerald-500/20 bg-emerald-500/10">
                SSL Seguro
              </Badge>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-border/50">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-xs gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Dirección
              </Button>
              <Button variant="default" size="sm" soundType="success" onClick={handleCompleteOrder} className="text-xs gap-1.5 px-6">
                Autorizar Pago y Finalizar <CheckCircle2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: ORDER CONFIRMED */}
      {step === 4 && (
        <Card className="max-w-xl mx-auto border-border text-center">
          <CardContent className="p-8 space-y-6">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                ¡Gracias por tu compra!
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Tu pedido ha sido procesado y el comprobante fue enviado a <strong className="text-foreground">{email}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-secondary/40 border border-border text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Número de Orden</span>
                <span className="font-mono font-bold text-foreground">#ORD-83922</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destinatario</span>
                <span className="text-foreground font-medium">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dirección de Entrega</span>
                <span className="text-foreground font-medium">{address}, {city}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border/50 font-bold">
                <span>Total Pagado</span>
                <span className="font-mono text-sm text-foreground tabular-nums">${total.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {onTrackOrder && (
                <Button
                  variant="default"
                  size="sm"
                  soundType="click"
                  onClick={() => {
                    onClearCart();
                    onTrackOrder();
                  }}
                  className="w-full sm:w-auto text-xs gap-1.5"
                >
                  <Truck className="h-3.5 w-3.5" />
                  Rastrear Envío en Vivo
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                soundType="click"
                onClick={() => pillToast.info('Descargando Factura PDF', 'Recibo criptográfico en proceso...')}
                className="w-full sm:w-auto text-xs gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Descargar Factura
              </Button>
              <Button
                variant="ghost"
                size="sm"
                soundType="click"
                onClick={() => {
                  onClearCart();
                  setStep(1);
                  onContinueShopping();
                }}
                className="w-full sm:w-auto text-xs"
              >
                Seguir Comprando
              </Button>
            </div>

            <div className="pt-4 text-left">
              <DeliveryProgress
                orderId="ORDEN / #ORD-83922"
                title="Tus productos están en camino."
                subtitle="Tu pedido fue verificado y el centro logístico lo está procesando."
                carrier="Envío estándar · Mensajería prioritaria"
                trackingNumber="1Z 984 02F 824"
                estimatedArrival={{
                  date: 'Jueves, 08 de Octubre',
                  window: 'Entre 10:00 AM y 2:00 PM',
                }}
                state={{ active: 0, expanded: 0 }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
