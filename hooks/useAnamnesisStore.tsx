import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { Anamnesis } from '@/types/medication';
import { showErrorToast } from '@/lib/toastHelper';
import { useAuthStore } from './useAuthStore';
import { isOldAnamnesis } from '@/lib/migration';
import { usePeopleStore, getPersonName } from './usePeopleStore';
import { ANAMNESIS_KEY } from '../src/constants/keys';

type AnamnesisData = Omit<Anamnesis, 'id' | 'lastUpdated'>;

interface AnamnesisState {
  anamnesisByPerson: Record<string, Anamnesis>;
  loadAnamnesis: () => Promise<void>;
  getAnamnesis: (personId: string) => Anamnesis | null;
  saveAnamnesis: (personId: string, anamnesisData: AnamnesisData) => Promise<void>;
  /** Remove a anamnese de uma pessoa (cascata). Persiste antes do set e lança em falha. */
  removeByPersonId: (personId: string) => Promise<void>;
  exportAnamnesis: (personId: string, currentData: AnamnesisData) => Promise<boolean>;
}

const createAnamnesisHtml = (anamnesis: AnamnesisData, userName: string): string => {
    // ... (função auxiliar, sem alterações)
    const { chronicConditions, allergies, surgeries, familyHistory, otherNotes } = anamnesis;
    const formatList = (items: string[] = []) => {
        if (items.every(item => !item.trim())) return '<li>Nenhuma informação fornecida.</li>';
        return items.filter(item => item.trim()).map(item => `<li>${item}</li>`).join('');
    };
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    return `
        <html>
            <head><style>body{font-family:sans-serif;margin:20px;color:#333}h1{color:#2D6A9F;border-bottom:2px solid #2D6A9F;padding-bottom:5px}h2{color:#444;margin-top:30px;border-bottom:1px solid #ccc;padding-bottom:3px}ul{list-style-type:disc;padding-left:20px}li{margin-bottom:5px}p{font-size:14px;color:#666;}</style></head>
            <body>
                <h1>Questionário de Anamnese</h1>
                <p><b>Paciente:</b> ${userName}</p>
                <p><b>Data de Exportação:</b> ${formatDate(new Date().toISOString())}</p>
                <h2>Condições Crônicas</h2><ul>${formatList(chronicConditions)}</ul>
                <h2>Alergias</h2><ul>${formatList(allergies)}</ul>
                <h2>Cirurgias Prévias</h2><ul>${formatList(surgeries)}</ul>
                <h2>Histórico Familiar</h2>
                <ul>
                    ${familyHistory.hypertension ? '<li>Hipertensão</li>' : ''}
                    ${familyHistory.diabetes ? '<li>Diabetes</li>' : ''}
                    ${familyHistory.heartDisease ? '<li>Doenças Cardíacas</li>' : ''}
                    ${familyHistory.cancer ? '<li>Câncer</li>' : ''}
                    ${familyHistory.other ? `<li>Outros: ${familyHistory.other}</li>` : ''}
                    ${!familyHistory.hypertension && !familyHistory.diabetes && !familyHistory.heartDisease && !familyHistory.cancer && !familyHistory.other ? '<li>Nenhuma informação fornecida.</li>' : ''}
                </ul>
                <h2>Notas Adicionais</h2>
                <p>${otherNotes || 'Nenhuma informação fornecida.'}</p>
            </body>
        </html>
    `;
};

export const useAnamnesisStore = create<AnamnesisState>((set, get) => ({
  anamnesisByPerson: {},

  loadAnamnesis: async () => {
    try {
      const stored = await AsyncStorage.getItem(ANAMNESIS_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') return;

      if (isOldAnamnesis(parsed)) {
        // Objeto único antigo (gravado entre a migração e a anamnese por pessoa):
        // pertence à pessoa ativa, ou à primeira se não houver ativa. Vai pro disco no próximo save.
        const { activePersonId, people } = usePeopleStore.getState();
        const ownerId = activePersonId ?? people[0]?.id;
        set({ anamnesisByPerson: ownerId ? { [ownerId]: parsed as Anamnesis } : {} });
      } else {
        set({ anamnesisByPerson: parsed as Record<string, Anamnesis> });
      }
    } catch (error) {
      console.error('Error loading anamnesis:', error);
    }
  },

  getAnamnesis: (personId) => get().anamnesisByPerson[personId] ?? null,

  saveAnamnesis: async (personId, anamnesisData) => {
    try {
      const current = get().anamnesisByPerson[personId];
      const updated: Anamnesis = {
        ...anamnesisData,
        id: current?.id ?? Crypto.randomUUID(),
        lastUpdated: new Date().toISOString(),
      };
      const nextMap = { ...get().anamnesisByPerson, [personId]: updated };

      await AsyncStorage.setItem(ANAMNESIS_KEY, JSON.stringify(nextMap));
      set({ anamnesisByPerson: nextMap });
    } catch (error) {
      console.error('Error saving anamnesis:', error);
      showErrorToast('Erro ao salvar a anamnese.');
    }
  },

  removeByPersonId: async (personId) => {
    const { [personId]: _removed, ...remaining } = get().anamnesisByPerson;
    await AsyncStorage.setItem(ANAMNESIS_KEY, JSON.stringify(remaining));
    set({ anamnesisByPerson: remaining });
  },

  exportAnamnesis: async (personId, currentData) => {
    const userProfile = useAuthStore.getState().userProfile;

    const hasData =
      currentData.chronicConditions?.some(c => c.trim()) ||
      currentData.allergies?.some(a => a.trim()) ||
      currentData.surgeries?.some(s => s.trim()) ||
      (currentData.familyHistory && Object.values(currentData.familyHistory).some(v => v)) ||
      currentData.otherNotes?.trim();

    if (!hasData) {
      return false;
    }

    try {
      // O PDF leva o nome da pessoa; o do perfil só entra se a pessoa não tiver nome.
      const patientName = getPersonName(personId) || userProfile?.name || 'Paciente';
      const htmlContent = createAnamnesisHtml(currentData, patientName);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar Anamnese' });
      return true;
    } catch (error) {
      console.error('Erro ao exportar anamnese:', error);
      return false;
    }
  },
}));
