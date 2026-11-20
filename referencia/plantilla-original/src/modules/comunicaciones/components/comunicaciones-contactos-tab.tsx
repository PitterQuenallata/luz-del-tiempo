import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  MessageSquare,
  Mail,
  Phone,
  Building,
  MapPin,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Input } from '../../../shared/components/ui/input';
import { CRMContact } from '../types/comunicaciones.types';
import { initialCRMContacts } from '../data/comunicaciones-data';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

interface ComunicacionesContactosTabProps {
  onStartChat: (contact: CRMContact) => void;
  onSendEmail: (contact: CRMContact) => void;
}

export const ComunicacionesContactosTab: React.FC<ComunicacionesContactosTabProps> = ({
  onStartChat,
  onSendEmail,
}) => {
  const { play } = useSound();
  const [contacts, setContacts] = useState<CRMContact[]>(initialCRMContacts);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newRole, setNewRole] = useState('Product Lead');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('+1 (555) 000-0000');
  const [newDept, setNewDept] = useState('Operaciones');
  const [newLocation, setNewLocation] = useState('San Francisco, CA');

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());

      const matchDept = departmentFilter === 'all' || c.department.includes(departmentFilter);
      return matchSearch && matchDept;
    });
  }, [contacts, search, departmentFilter]);

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      play('alert');
      pillToast.error('Datos Requeridos', 'Ingresa nombre y correo del contacto.');
      return;
    }

    const created: CRMContact = {
      id: `crm-${Date.now()}`,
      name: newName,
      company: newCompany || 'Empresa Independiente',
      role: newRole,
      email: newEmail,
      phone: newPhone,
      avatar: `/images/profile/user-${Math.floor(1 + Math.random() * 12)}.jpg`,
      department: newDept,
      location: newLocation,
    };

    setContacts([created, ...contacts]);
    setIsModalOpen(false);
    setNewName('');
    setNewEmail('');
    play('success');
    pillToast.success('Contacto Añadido', `Se registró a ${created.name} en el directorio.`);
  };

  const handleDeleteContact = (id: string, name: string) => {
    play('alert');
    setContacts(contacts.filter((c) => c.id !== id));
    pillToast.info('Contacto Eliminado', `Se removió a ${name}.`);
  };

  return (
    <div className="space-y-6">
      {/* Header and Toolbar Card */}
      <Card className="border-border">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold">Directorio CRM de Contactos & Clientes</CardTitle>
              <CardDescription className="text-xs">
                Acceso directo a ejecutivos, socios comerciales y proveedores estratégicos
              </CardDescription>
            </div>

            <Button
              variant="default"
              size="sm"
              soundType="pop"
              onClick={() => {
                play('pop');
                setIsModalOpen(true);
              }}
              className="text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Nuevo Contacto
            </Button>
          </div>

          {/* Search & Department Filters */}
          <div className="pt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, empresa o correo..."
                className="pl-9 text-xs h-9 bg-background"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={departmentFilter}
                onChange={(e) => {
                  play('click');
                  setDepartmentFilter(e.target.value);
                }}
                className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
              >
                <option value="all">Todos los Departamentos</option>
                <option value="Investigación">Investigación & UX</option>
                <option value="Tecnológica">Ingeniería & Cloud</option>
                <option value="Operaciones">Operaciones B2B</option>
                <option value="Diseño">Sistemas de Diseño</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="group p-5 rounded-2xl border border-border bg-card/60 hover:bg-card hover:border-foreground/25 hover:shadow-xs transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="h-12 w-12 rounded-2xl object-cover border border-border"
                    />
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {contact.department.split(' ')[0]}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-foreground line-clamp-1">{contact.name}</h4>
                    <span className="text-[11px] text-muted-foreground block line-clamp-1 font-medium">
                      {contact.company}
                    </span>
                    <span className="text-[10px] text-primary font-mono block mt-0.5">
                      {contact.role}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-muted-foreground font-mono pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span className="truncate">{contact.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{contact.location}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    soundType="click"
                    onClick={() => {
                      play('click');
                      onStartChat(contact);
                    }}
                    className="flex-1 text-[11px] h-8 gap-1.5 justify-center"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chat
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    soundType="click"
                    onClick={() => {
                      play('click');
                      onSendEmail(contact);
                    }}
                    className="flex-1 text-[11px] h-8 gap-1.5 justify-center"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Correo
                  </Button>

                  <button
                    type="button"
                    onClick={() => handleDeleteContact(contact.id, contact.name)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-secondary cursor-pointer transition-colors"
                    title="Eliminar contacto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg border-border shadow-2xl">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Registrar Nuevo Contacto</CardTitle>
                  <CardDescription className="text-xs">
                    Añade un cliente, proveedor o colaborador a la libreta corporativa
                  </CardDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <form onSubmit={handleCreateContact}>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-foreground block mb-1.5">Nombre Completo *</label>
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="ej. Daniel Quiroga"
                      className="text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-medium text-foreground block mb-1.5">Empresa / Razón Social</label>
                    <Input
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      placeholder="ej. Infrasphere Global"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-foreground block mb-1.5">Correo Electrónico *</label>
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="ej. daniel@infrasphere.net"
                      className="text-xs font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-medium text-foreground block mb-1.5">Teléfono Directo</label>
                    <Input
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-medium text-foreground block mb-1.5">Cargo / Rol</label>
                    <Input
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-foreground block mb-1.5">Departamento</label>
                    <Input
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-foreground block mb-1.5">Ubicación</label>
                    <Input
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              </CardContent>

              <div className="p-4 border-t border-border/50 flex items-center justify-end gap-2 bg-secondary/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  soundType="click"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  soundType="success"
                  className="text-xs gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Guardar Contacto
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
