import React, { useState } from 'react';
import {
  Truck,
  Package,
  Search,
  ExternalLink,
  Copy,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { DeliveryProgress, DeliveryStep } from '@/components/ui/delivery-progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { pillToast } from '@/shared/components/ui/pill-toast';
import { cn } from '@/lib/utils';

export interface OrderTrackingItem {
  id: string;
  orderNumber: string;
  customer: string;
  itemSummary: string;
  amount: string;
  carrier: string;
  trackingNumber: string;
  title: string;
  subtitle: string;
  estimatedArrival: {
    date: string;
    window: string;
  };
  activeStep: number;
  steps: DeliveryStep[];
}

const SAMPLE_ORDERS: OrderTrackingItem[] = [
  {
    id: 'ord-1',
    orderNumber: 'PEDIDO / FR—2084',
    customer: 'Mathew Anderson',
    itemSummary: 'Audífonos Inalámbricos Studio Pro (Space Gray)',
    amount: '$349.00 USD',
    carrier: 'Envío estándar · Paquetería nacional',
    trackingNumber: '1Z 984 02F 824',
    title: 'Tus productos están en camino.',
    subtitle: 'Tu paquete está próximo a la dirección de entrega.',
    estimatedArrival: {
      date: 'Jueves, 08 de Octubre',
      window: 'Entre 10:00 AM y 2:00 PM',
    },
    activeStep: 2, // En reparto
    steps: [
      {
        label: 'Pedido confirmado',
        time: '05 OCT · 09:42',
        detail: 'Tu orden fue confirmada. El equipo de fulfillment está preparando tus artículos.',
      },
      {
        label: 'Empacado & despachado',
        time: '06 OCT · 14:18',
        detail: 'Empacado con altos estándares en nuestro centro de distribución y recogido por el transportista.',
      },
      {
        label: 'En reparto local',
        time: '08 OCT · 08:06',
        detail: 'Tu paquete ha salido del centro logístico local y está en el vehículo de entrega.',
      },
      {
        label: 'Entregado con éxito',
        time: '08 OCT · 11:24',
        detail: 'Entregado en la dirección indicada. ¡Gracias por confiar en nuestra plataforma!',
      },
    ],
  },
  {
    id: 'ord-2',
    orderNumber: 'PEDIDO / BL—9021',
    customer: 'Camila Torres',
    itemSummary: 'MacBook Pro 16" M4 Max 64GB',
    amount: '$3,499.00 USD',
    carrier: 'DHL Express · Vía Aérea Prioritaria',
    trackingNumber: '9400 1000 0000 0021',
    title: 'Tu paquete ha sido entregado.',
    subtitle: 'Recepcionado con firma en la mesa de entrada corporativa.',
    estimatedArrival: {
      date: 'Martes, 06 de Octubre',
      window: 'Entregado a las 14:22 PM',
    },
    activeStep: 3, // Entregado
    steps: [
      {
        label: 'Pedido confirmado',
        time: '04 OCT · 11:20',
        detail: 'Orden recibida y pago verificado mediante Apple Pay.',
      },
      {
        label: 'Empacado & despachado',
        time: '05 OCT · 08:45',
        detail: 'Inspección de control de calidad superada y embalado con protección de burbuja térmica.',
      },
      {
        label: 'En reparto local',
        time: '06 OCT · 09:15',
        detail: 'Repartidor asignado en ruta de distribución matutina.',
      },
      {
        label: 'Entregado con éxito',
        time: '06 OCT · 14:22',
        detail: 'Firmado y entregado en recepción principal (Torre Titanium).',
      },
    ],
  },
  {
    id: 'ord-3',
    orderNumber: 'PEDIDO / NY—3401',
    customer: 'David Morales',
    itemSummary: 'Teclado Mecánico Custom 75% + Keycaps PBT',
    amount: '$189.00 USD',
    carrier: 'FedEx Ground · Envío Terrestre Rastreado',
    trackingNumber: '7721 9820 4410',
    title: 'Paquete empacado y en tránsito.',
    subtitle: 'Salió de nuestro almacén central hacia el centro de clasificación regional.',
    estimatedArrival: {
      date: 'Lunes, 12 de Octubre',
      window: 'Entre 1:00 PM y 5:00 PM',
    },
    activeStep: 1, // Empacado
    steps: [
      {
        label: 'Pedido confirmado',
        time: '07 OCT · 16:30',
        detail: 'Ensamblado de switches y calibración de estabilizadores concluida.',
      },
      {
        label: 'Empacado & despachado',
        time: '08 OCT · 10:15',
        detail: 'Recolectado por mensajería y registrado en la red logística nacional.',
      },
      {
        label: 'En reparto local',
        time: 'Pendiente de ruta',
        detail: 'Se actualizará cuando la furgoneta de entrega inicie el recorrido.',
      },
      {
        label: 'Entregado con éxito',
        time: 'Pendiente de entrega',
        detail: 'Entrega segura con confirmación directa en domicilio residencial.',
      },
    ],
  },
];

export const EcommerceOrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<OrderTrackingItem[]>(SAMPLE_ORDERS);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(SAMPLE_ORDERS[0].id);
  const [searchFilter, setSearchFilter] = useState('');

  const currentOrder = orders.find((o) => o.id === selectedOrderId) ?? orders[0];

  const handleStepChange = (newStep: number) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === currentOrder.id ? { ...order, activeStep: newStep } : order
      )
    );
  };

  const handleCopyTracking = (tracking: string) => {
    navigator.clipboard.writeText(tracking);
    pillToast.success('Tracking Copiado', `Código ${tracking} copiado al portapapeles.`);
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchFilter.toLowerCase()) ||
      o.itemSummary.toLowerCase().includes(searchFilter.toLowerCase()) ||
      o.trackingNumber.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Progreso de Estados & Seguimiento de Envíos
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Componente de trazabilidad interactiva para estados de pedidos, logística y paquetería
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Orders List / Selector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Pedidos Registrados
              </span>
              <Badge variant="outline" className="text-xs font-mono">
                {orders.length} pedidos
              </Badge>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por orden, cliente o código..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="h-9 pl-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-2 pt-1">
              {filteredOrders.map((ord) => {
                const isSelected = ord.id === currentOrder.id;
                const isDone = ord.activeStep === ord.steps.length - 1;

                return (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={cn(
                      'w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2',
                      isSelected
                        ? 'border-primary/60 bg-primary/5 shadow-xs'
                        : 'border-border/60 bg-background/50 hover:bg-muted/40 hover:border-border'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {ord.orderNumber}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full capitalize font-medium',
                          isDone
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        )}
                      >
                        {ord.steps[ord.activeStep].label}
                      </Badge>
                    </div>

                    <p className="text-xs text-foreground/90 font-medium truncate">
                      {ord.itemSummary}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{ord.customer}</span>
                      <span className="font-mono font-medium text-foreground">
                        {ord.amount}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Featured DeliveryProgress Card */}
        <div className="lg:col-span-7 space-y-4">
          <DeliveryProgress
            key={currentOrder.id}
            orderId={currentOrder.orderNumber}
            title={currentOrder.title}
            subtitle={currentOrder.subtitle}
            steps={currentOrder.steps}
            carrier={currentOrder.carrier}
            trackingNumber={currentOrder.trackingNumber}
            estimatedArrival={currentOrder.estimatedArrival}
            state={{ active: currentOrder.activeStep, expanded: currentOrder.activeStep }}
            onStateChange={(st) => {
              if (st.active !== undefined) {
                handleStepChange(st.active);
              }
            }}
            showControls={true}
          />
        </div>
      </div>
    </div>
  );
};

export default EcommerceOrdersTab;
