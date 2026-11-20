import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { expandableInvoicesData } from '../data/tables-data';
import { ExpandableInvoice } from '../types/tables.types';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Printer,
  Mail,
  Receipt,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

export const TablesExpandableTab: React.FC = () => {
  const { play } = useSound();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    'INV-2026-8801': true, // Expanded by default for showcase
  });

  const toggleRow = (id: string) => {
    play('click');
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDownloadPdf = (invoiceNumber: string) => {
    play('pop');
    pillToast.success('Descarga Iniciada', `Generando PDF fiscal para la factura ${invoiceNumber}.`);
  };

  const handleResendInvoice = (client: string) => {
    play('success');
    pillToast.info('Factura Reenviada', `Copia electrónica despachada a la administración de ${client}.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" className="text-[10px]">
              Sub-Filas Jerárquicas
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Modernize Suite
            </Badge>
          </div>
          <CardTitle>Facturación Corporativa con Detalle de Partidas Desglosadas</CardTitle>
          <CardDescription>
            Haz clic en cualquier fila para desplegar el desglose granular de partidas, tasas impositivas y resumen fiscal con animación fluida.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4 w-10"></th>
                  <th className="py-3 px-4">N° Factura</th>
                  <th className="py-3 px-4">Entidad Contratante</th>
                  <th className="py-3 px-4">Emisión</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-right">Importe Total</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {expandableInvoicesData.map((inv) => {
                  const isExpanded = !!expandedIds[inv.id];

                  return (
                    <React.Fragment key={inv.id}>
                      {/* Main Parent Row */}
                      <tr
                        onClick={() => toggleRow(inv.id)}
                        className={cn(
                          'cursor-pointer transition-colors select-none',
                          isExpanded ? 'bg-muted/30 font-medium' : 'hover:bg-muted/20'
                        )}
                      >
                        <td className="py-3 px-4 text-muted-foreground">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-primary">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-semibold text-foreground block">{inv.clientCompany}</span>
                            <span className="text-[11px] text-muted-foreground">{inv.contactPerson}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{inv.issueDate}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{inv.dueDate}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-foreground">
                          ${inv.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              inv.paymentStatus === 'Pagada'
                                ? 'success'
                                : inv.paymentStatus === 'En Revisión'
                                ? 'warning'
                                : 'destructive'
                            }
                            className="text-[10px]"
                          >
                            {inv.paymentStatus}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadPdf(inv.invoiceNumber)}
                              className="h-7 w-7 p-0"
                              title="Descargar PDF"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvoice(inv.clientCompany)}
                              className="h-7 w-7 p-0"
                              title="Reenviar Factura"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Sub-Row Detail */}
                      {isExpanded && (
                        <tr className="bg-muted/10 border-b border-border/60">
                          <td colSpan={8} className="p-4 sm:p-6 pl-10">
                            <div className="rounded-2xl border border-border/60 bg-background/80 p-5 space-y-4">
                              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                                  <Receipt className="h-4 w-4 text-primary" />
                                  <span>Desglose de Conceptos Facturados ({inv.items.length} partidas)</span>
                                </div>
                                <span className="font-mono text-[11px] text-muted-foreground">
                                  ID Auditoría: {inv.id}
                                </span>
                              </div>

                              {/* Items Sub-Table */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-border/40 text-[10px] text-muted-foreground uppercase font-semibold">
                                      <th className="pb-2">SKU</th>
                                      <th className="pb-2">Descripción del Servicio</th>
                                      <th className="pb-2 text-right">Cantidad</th>
                                      <th className="pb-2 text-right">Precio Unitario</th>
                                      <th className="pb-2 text-right">IVA (%)</th>
                                      <th className="pb-2 text-right">Importe Neto</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/20">
                                    {inv.items.map((item) => (
                                      <tr key={item.id} className="text-muted-foreground">
                                        <td className="py-2.5 font-mono text-[11px] text-primary">{item.sku}</td>
                                        <td className="py-2.5 font-medium text-foreground">{item.description}</td>
                                        <td className="py-2.5 text-right font-mono tabular-nums">{item.quantity}</td>
                                        <td className="py-2.5 text-right font-mono tabular-nums">
                                          ${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2.5 text-right font-mono tabular-nums">{item.taxRate}%</td>
                                        <td className="py-2.5 text-right font-mono tabular-nums font-semibold text-foreground">
                                          ${item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Total Calculation Grid */}
                              <div className="pt-3 border-t border-border/40 flex justify-end">
                                <div className="w-64 space-y-1.5 text-xs">
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal Base:</span>
                                    <span className="font-mono tabular-nums">
                                      ${inv.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  {inv.discount > 0 && (
                                    <div className="flex justify-between text-emerald-500">
                                      <span>Descuento de Convenio:</span>
                                      <span className="font-mono tabular-nums">
                                        -${inv.discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Impuestos y Retenciones (21%):</span>
                                    <span className="font-mono tabular-nums">
                                      ${inv.taxTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  <div className="flex justify-between font-bold text-foreground pt-1.5 border-t border-border/40 text-sm">
                                    <span>Total Facturado:</span>
                                    <span className="font-mono tabular-nums text-primary">
                                      ${inv.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
