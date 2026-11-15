import React from 'react';
import { spacing } from '@/constants/theme';
import { usePeopleStore } from '@/hooks/usePeopleStore';
import { PersonChips } from '@/components/PersonChips';

/** Escolhe a pessoa ativa (filtro de Remédios, Histórico, Consultas e Anamnese). Some com menos de 2 pessoas. */
export function PersonSelector() {
  const activePersonId = usePeopleStore((s) => s.activePersonId);
  const setActivePerson = usePeopleStore((s) => s.setActivePerson);

  return (
    <PersonChips
      value={activePersonId}
      onChange={(id) => void setActivePerson(id)}
      inset={spacing.lg}
    />
  );
}
