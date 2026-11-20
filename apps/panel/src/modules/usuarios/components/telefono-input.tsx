import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { luzApi, Pais } from '../../../shared/api/luz-api';
import { bandera } from '../lib/usuario';

interface TelefonoInputProps {
  codigo: string;
  numero: string;
  onChange: (codigo: string, numero: string) => void;
  id?: string;
}

// Teléfono con código de país (bandera y nombre). Bolivia por defecto, 8 dígitos.
export const TelefonoInput: React.FC<TelefonoInputProps> = ({ codigo, numero, onChange, id = 'telefono' }) => {
  const { data } = useQuery({ queryKey: ['paises'], queryFn: () => luzApi.listPaises(), staleTime: Infinity });
  const paises: Pais[] = data?.paises ?? [];
  const pais = paises.find((p) => p.codigo === codigo);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pais || !numero) return setError(null);
    const largo = numero.length;
    setError(
      largo < pais.digitosMin || largo > pais.digitosMax
        ? pais.digitosMin === pais.digitosMax
          ? `Debe tener ${pais.digitosMin} dígitos.`
          : `Debe tener entre ${pais.digitosMin} y ${pais.digitosMax} dígitos.`
        : null
    );
  }, [numero, pais]);

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <select
          aria-label="Código de país"
          value={codigo}
          onChange={(e) => onChange(e.target.value, numero)}
          className="h-9 w-36 px-2 rounded-xl border border-border bg-background text-xs"
        >
          {paises.map((p) => (
            <option key={p.codigo} value={p.codigo}>
              {bandera(p.iso)} {p.codigo} {p.nombre}
            </option>
          ))}
        </select>
        <input
          id={id}
          inputMode="numeric"
          value={numero}
          maxLength={pais?.digitosMax ?? 15}
          placeholder={pais ? '0'.repeat(pais.digitosMin) : ''}
          onChange={(e) => onChange(codigo, e.target.value.replace(/\D/g, ''))}
          className="flex-1 h-9 px-3 rounded-xl border border-border bg-background text-xs font-mono"
        />
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
};

export const telefonoValido = (codigo: string, numero: string, paises: Pais[]): boolean => {
  if (!numero) return true;
  const p = paises.find((x) => x.codigo === codigo);
  return !!p && numero.length >= p.digitosMin && numero.length <= p.digitosMax;
};
