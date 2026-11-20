import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { Switch } from '../../../shared/components/ui/switch';
import { editableStaffData } from '../data/tables-data';
import { EditableStaffMember } from '../types/tables.types';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';
import {
  ShieldCheck,
  CheckCircle2,
  Save,
  RotateCcw,
  UserCheck,
  UserX,
  Shield,
  KeyRound,
  Trash2,
} from 'lucide-react';

export const TablesEditableTab: React.FC = () => {
  const { play } = useSound();
  const [staff, setStaff] = useState<EditableStaffMember[]>(editableStaffData);
  const [dirtyRows, setDirtyRows] = useState<Record<string, boolean>>({});

  const handleRoleChange = (id: string, newRole: EditableStaffMember['role']) => {
    play('click');
    setStaff((prev) =>
      prev.map((item) => (item.id === id ? { ...item, role: newRole } : item))
    );
    setDirtyRows((prev) => ({ ...prev, [id]: true }));
  };

  const handleToggleStatus = (id: string, checked: boolean) => {
    play('toggle');
    setStaff((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isActive: checked } : item))
    );
    setDirtyRows((prev) => ({ ...prev, [id]: true }));
  };

  const handleToggle2fa = (id: string, checked: boolean) => {
    play('toggle');
    setStaff((prev) =>
      prev.map((item) => (item.id === id ? { ...item, twoFactorEnabled: checked } : item))
    );
    setDirtyRows((prev) => ({ ...prev, [id]: true }));
  };

  const handleSaveRow = (id: string) => {
    play('success');
    setDirtyRows((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    const member = staff.find((m) => m.id === id);
    pillToast.success(
      'Permisos Actualizados',
      `Los privilegios y credenciales de ${member?.fullName} han sido sincronizados.`
    );
  };

  const handleResetRow = (id: string) => {
    play('pop');
    const original = editableStaffData.find((m) => m.id === id);
    if (original) {
      setStaff((prev) => prev.map((item) => (item.id === id ? { ...original } : item)));
    }
    setDirtyRows((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    pillToast.info('Cambios Descartados', 'Se restauraron los valores almacenados en base de datos.');
  };

  const hasDirtyRows = Object.keys(dirtyRows).length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="text-[10px]">
                  Edición en Línea
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  Reactivo
                </Badge>
              </div>
              <CardTitle>Control de Acceso y Gestión de Privilegios en Vivo</CardTitle>
              <CardDescription>
                Modifica roles, activa o inhabilita cuentas y exige verificación 2FA directamente sobre cada celda de la tabla.
              </CardDescription>
            </div>

            {hasDirtyRows && (
              <Badge variant="warning" className="self-start sm:self-auto font-mono text-xs">
                {Object.keys(dirtyRows).length} cambio(s) sin guardar
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Miembro / Correo</th>
                  <th className="py-3 px-4">Departamento</th>
                  <th className="py-3 px-4">Rol Asignado</th>
                  <th className="py-3 px-4 text-center">Estado Activo</th>
                  <th className="py-3 px-4 text-center">2FA Obligatorio</th>
                  <th className="py-3 px-4">Nivel de Acceso</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {staff.map((member) => {
                  const isDirty = !!dirtyRows[member.id];

                  return (
                    <tr
                      key={member.id}
                      className={cn(
                        'transition-colors',
                        isDirty ? 'bg-amber-500/5' : 'hover:bg-muted/30'
                      )}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-xs">
                              {member.fullName}
                            </span>
                            {isDirty && (
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Modificado" />
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {member.email}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground font-medium">
                        {member.department}
                      </td>

                      {/* Inline Role Select */}
                      <td className="py-3 px-4">
                        <select
                          className="h-8 px-2.5 text-xs rounded-xl bg-background border border-border text-foreground font-medium focus:ring-1 focus:ring-primary focus:outline-hidden cursor-pointer"
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member.id, e.target.value as EditableStaffMember['role'])
                          }
                        >
                          <option value="Administrador">Administrador</option>
                          <option value="Ingeniero Cloud">Ingeniero Cloud</option>
                          <option value="Auditor">Auditor</option>
                          <option value="Operador">Operador</option>
                        </select>
                      </td>

                      {/* Inline Active Switch */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={member.isActive}
                            onCheckedChange={(checked) => handleToggleStatus(member.id, checked)}
                          />
                        </div>
                      </td>

                      {/* Inline 2FA Switch */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={member.twoFactorEnabled}
                            onCheckedChange={(checked) => handleToggle2fa(member.id, checked)}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            member.accessTier === 'Tier 1'
                              ? 'default'
                              : member.accessTier === 'Tier 2'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-[10px] font-mono"
                        >
                          {member.accessTier}
                        </Badge>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        {isDirty ? (
                          <div className="flex items-center justify-end gap-1.5 animate-in fade-in">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleSaveRow(member.id)}
                              className="h-7 px-2.5 text-xs gap-1"
                            >
                              <Save className="h-3 w-3" />
                              Guardar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResetRow(member.id)}
                              className="h-7 w-7 p-0 text-muted-foreground"
                              title="Descartar cambios"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {member.lastActive}
                          </span>
                        )}
                      </td>
                    </tr>
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
