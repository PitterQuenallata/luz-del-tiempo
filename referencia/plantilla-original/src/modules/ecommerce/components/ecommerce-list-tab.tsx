import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Eye,
  Trash2,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useIconHover } from '@animateicons/react';
import { DownloadIcon } from '@animateicons/react/lucide';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Input } from '../../../shared/components/ui/input';
import { Product } from '../types/ecommerce';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

interface EcommerceListTabProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigateToAdd: () => void;
  onDeleteProduct: (id: string) => void;
}

export const EcommerceListTab: React.FC<EcommerceListTabProps> = ({
  products,
  onSelectProduct,
  onNavigateToAdd,
  onDeleteProduct,
}) => {
  const { play } = useSound();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'low_stock' | 'out_of_stock'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const downloadHover = useIconHover();

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const toggleSelectAll = () => {
    play('click');
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    play('click');
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: Product['status']) => {
    switch (status) {
      case 'published':
        return (
          <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            Publicado
          </Badge>
        );
      case 'low_stock':
        return (
          <Badge variant="outline" className="text-[10px] font-mono bg-amber-500/10 text-amber-500 border-amber-500/20">
            Bajo Stock
          </Badge>
        );
      case 'out_of_stock':
        return (
          <Badge variant="outline" className="text-[10px] font-mono bg-red-500/10 text-red-500 border-red-500/20">
            Agotado
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="text-[10px] font-mono">Borrador</Badge>;
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold">Gestión de Inventario & Productos</CardTitle>
            <CardDescription className="text-xs">
              Catálogo maestro con control de stock en tiempo real, SKU y precios
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              soundType="click"
              {...downloadHover.triggerProps}
              onClick={() => {
                play('click');
                pillToast.info('Exportación CSV Generada', 'El archivo de inventario se descargó.');
              }}
              className="text-xs gap-1.5"
            >
              <DownloadIcon ref={downloadHover.ref} className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              soundType="click"
              onClick={() => {
                play('click');
                onNavigateToAdd();
              }}
              className="text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por SKU, nombre o categoría..."
              className="pl-9 text-xs h-8 bg-background"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(['all', 'published', 'low_stock', 'out_of_stock'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  play('tab');
                  setStatusFilter(st);
                }}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer whitespace-nowrap',
                  statusFilter === st
                    ? 'bg-foreground text-background font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/50'
                )}
              >
                {st === 'all' ? 'Todos' : st === 'published' ? 'Publicados' : st === 'low_stock' ? 'Bajo Stock' : 'Agotados'}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded accent-primary cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-medium">Producto & SKU</th>
                <th className="py-3 px-4 font-medium">Categoría</th>
                <th className="py-3 px-4 font-medium text-right">Existencias</th>
                <th className="py-3 px-4 font-medium text-right">Precio Unitario</th>
                <th className="py-3 px-4 font-medium text-center">Estatus</th>
                <th className="py-3 px-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map((product) => {
                const isSelected = selectedIds.includes(product.id);
                return (
                  <tr
                    key={product.id}
                    className={cn(
                      'hover:bg-muted/30 transition-colors',
                      isSelected && 'bg-primary/[0.04]'
                    )}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(product.id)}
                        className="rounded accent-primary cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="h-10 w-10 rounded-xl object-cover border border-border shrink-0 cursor-pointer"
                          onClick={() => onSelectProduct(product)}
                        />
                        <div>
                          <span
                            onClick={() => onSelectProduct(product)}
                            className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer block line-clamp-1"
                          >
                            {product.title}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {product.sku}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {product.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono font-semibold text-foreground tabular-nums">
                          {product.stockQty} uds
                        </span>
                        <div className="w-16 bg-secondary h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              product.stockQty > 20
                                ? 'bg-emerald-500'
                                : product.stockQty > 0
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            )}
                            style={{ width: `${Math.min(100, (product.stockQty / 100) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold text-foreground text-sm tabular-nums">
                        ${product.price}.00
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="iconSm"
                          soundType="click"
                          onClick={() => {
                            play('click');
                            onSelectProduct(product);
                          }}
                          title="Ver ficha completa"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          soundType="alert"
                          onClick={() => {
                            onDeleteProduct(product.id);
                            pillToast.warning('Producto Eliminado', `${product.title} fue retirado del inventario.`);
                          }}
                          title="Eliminar producto"
                          className="hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            Mostrando <strong className="text-foreground">{filtered.length}</strong> productos
            {selectedIds.length > 0 && ` (${selectedIds.length} seleccionados)`}
          </span>
          <span className="font-mono text-[11px]">Inventario sincronizado con WMS</span>
        </div>
      </CardContent>
    </Card>
  );
};
