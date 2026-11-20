import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Badge } from '../../../shared/components/ui/badge';
import { initialTransactions } from '../data/tables-data';
import { CustomerTransaction, TransactionStatus } from '../types/tables.types';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
  CreditCard,
} from 'lucide-react';

export const TablesDataTableTab: React.FC = () => {
  const { play } = useSound();
  const [data, setData] = useState<CustomerTransaction[]>(initialTransactions);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [density, setDensity] = useState<'compact' | 'normal' | 'relaxed'>('normal');

  const columns = useMemo<ColumnDef<CustomerTransaction>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="rounded border-border accent-primary cursor-pointer h-4 w-4"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) => {
              play('click');
              table.toggleAllPageRowsSelected(!!e.target.checked);
            }}
            aria-label="Seleccionar todas las filas"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="rounded border-border accent-primary cursor-pointer h-4 w-4"
            checked={row.getIsSelected()}
            onChange={(e) => {
              play('click');
              row.toggleSelected(!!e.target.checked);
            }}
            aria-label="Seleccionar fila"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'reference',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Referencia
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-primary">
            {row.getValue('reference')}
          </span>
        ),
      },
      {
        accessorKey: 'customerName',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-3 h-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            Cliente
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[10px] text-foreground">
                {item.avatarText}
              </div>
              <div>
                <p className="font-semibold text-foreground text-xs">{item.customerName}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{item.customerEmail}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Método',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CreditCard className="h-3 w-3" />
            {row.getValue('paymentMethod')}
          </span>
        ),
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Monto (USD)
              {column.getIsSorted() === 'asc' ? (
                <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary" />
              ) : column.getIsSorted() === 'desc' ? (
                <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary" />
              ) : (
                <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />
              )}
            </Button>
          </div>
        ),
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue('amount'));
          const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(amount);
          return (
            <div className="text-right font-mono tabular-nums font-semibold text-xs text-foreground">
              {formatted}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        cell: ({ row }) => {
          const status = row.getValue('status') as TransactionStatus;
          const variantMap: Record<TransactionStatus, 'success' | 'warning' | 'destructive' | 'blue'> = {
            Completado: 'success',
            Pendiente: 'warning',
            Fallido: 'destructive',
            Reembolsado: 'blue',
          };
          return (
            <Badge variant={variantMap[status]} className="text-[10px]">
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Fecha Registro',
        cell: ({ row }) => (
          <span className="font-mono text-[11px] text-muted-foreground">
            {row.getValue('createdAt')}
          </span>
        ),
      },
    ],
    [play]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });

  const selectedCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length;

  const handleExportSelected = () => {
    play('pop');
    pillToast.success(
      'Exportación Generada',
      `Se han exportado ${selectedCount} transacciones en formato CSV RFC-4180.`
    );
  };

  const handleBatchComplete = () => {
    play('success');
    const selectedIndices = Object.keys(rowSelection).filter((k) => rowSelection[k]);
    const updated = data.map((item, idx) =>
      selectedIndices.includes(idx.toString()) ? { ...item, status: 'Completado' as TransactionStatus } : item
    );
    setData(updated);
    setRowSelection({});
    pillToast.success('Lote Procesado', `${selectedCount} transacciones marcadas como Completadas.`);
  };

  const handleBatchDelete = () => {
    play('alert');
    const selectedIndices = Object.keys(rowSelection).filter((k) => rowSelection[k]);
    const updated = data.filter((_, idx) => !selectedIndices.includes(idx.toString()));
    setData(updated);
    setRowSelection({});
    pillToast.info('Registros Archivados', `${selectedCount} transacciones removidas de la vista activa.`);
  };

  const getPaddingClass = () => {
    if (density === 'compact') return 'py-2 px-3 text-xs';
    if (density === 'relaxed') return 'py-4 px-4 text-xs';
    return 'py-3 px-4 text-xs';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="text-[10px]">
                  TanStack Table v8
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  Type-Safe
                </Badge>
              </div>
              <CardTitle>Data Table Headless con Controles Apple HIG</CardTitle>
              <CardDescription>
                Ordenamiento multi-campo, búsqueda reactiva, conmutador de densidad visual y barra de operaciones en lote.
              </CardDescription>
            </div>

            {/* Density Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/60 border border-border/50 text-xs self-start sm:self-auto">
              <span className="text-[11px] text-muted-foreground px-2">Densidad:</span>
              {(['compact', 'normal', 'relaxed'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    play('click');
                    setDensity(d);
                  }}
                  className={cn(
                    'px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer text-xs font-medium',
                    density === d ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {d === 'compact' ? 'Compacta' : d === 'normal' ? 'Normal' : 'Espaciada'}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Top Actions & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar por referencia, cliente o método..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 text-xs font-mono h-9"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Status Filter */}
              <select
                className="h-9 px-3 text-xs rounded-xl bg-background border border-border text-foreground cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-primary"
                value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
                onChange={(e) => {
                  play('click');
                  table.getColumn('status')?.setFilterValue(e.target.value || undefined);
                }}
              >
                <option value="">Todos los Estados</option>
                <option value="Completado">Completado</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Fallido">Fallido</option>
                <option value="Reembolsado">Reembolsado</option>
              </select>
            </div>
          </div>

          {/* Batch Actions Bar (when rows are selected) */}
          {selectedCount > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-primary/10 border border-primary/20 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-primary font-medium">
                <Check className="h-4 w-4" />
                <span>
                  <strong className="font-mono tabular-nums">{selectedCount}</strong> fila(s) seleccionada(s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportSelected} className="h-7 text-xs gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Exportar CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleBatchComplete} className="h-7 text-xs gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Marcar Completado
                </Button>
                <Button variant="outline" size="sm" onClick={handleBatchDelete} className="h-7 text-xs gap-1.5 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                  Archivar
                </Button>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className="rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="py-3 px-4 select-none">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-border/40">
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                        className={cn(
                          'transition-colors hover:bg-muted/30',
                          row.getIsSelected() ? 'bg-primary/5' : ''
                        )}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className={getPaddingClass()}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="h-28 text-center text-xs text-muted-foreground">
                        No se encontraron transacciones que coincidan con los criterios.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Filas por página:</span>
              <select
                className="h-8 px-2 text-xs rounded-lg bg-background border border-border text-foreground font-mono"
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  play('click');
                  table.setPageSize(Number(e.target.value));
                }}
              >
                {[5, 10, 20].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
              <span className="font-mono tabular-nums pl-2">
                Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  play('click');
                  table.previousPage();
                }}
                disabled={!table.getCanPreviousPage()}
                className="h-8 px-3 text-xs gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  play('click');
                  table.nextPage();
                }}
                disabled={!table.getCanNextPage()}
                className="h-8 px-3 text-xs gap-1"
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
