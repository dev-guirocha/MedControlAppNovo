import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import * as Crypto from 'expo-crypto';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { Anamnesis } from '@/types/medication';
import { showErrorToast } from '@/lib/toastHelper';
import { useAuthStore } from './useAuthStore';
import { ANAMNESIS_KEY } from '../src/constants/keys';

type AnamnesisData = Omit<Anamnesis, 'id' | 'lastUpdated'>;

interface AnamnesisState {
  anamnesis: Anamnesis | null;
  loadAnamnesis: () => Promise<void>;
  saveAnamnesis: (anamnesisData: AnamnesisData) => Promise<void>;
  updateAnamnesis: (updates: Partial<Anamnesis>) => Promise<void>;
  exportAnamnesis: (currentData: AnamnesisData) => Promise<boolean>; // ✅ Modificado para receber os dados
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
  anamnesis: null,
  
  loadAnamnesis: async () => {
    try {
      const stored = await AsyncStorage.getItem(ANAMNESIS_KEY);
      if (!stored) return;

      const parsed: Anamnesis = JSON.parse(stored);
      set({ anamnesis: parsed });
    } catch (error) {
      console.error('Error loading anamnesis:', error);
    }
  },
  
  saveAnamnesis: async (anamnesisData) => {
    try {
      const current = get().anamnesis;
      const updated: Anamnesis = {
        ...anamnesisData,
        id: current?.id ?? Crypto.randomUUID(),
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(ANAMNESIS_KEY, JSON.stringify(updated));
      set({ anamnesis: updated });
    } catch (error) {
      console.error('Error saving anamnesis:', error);
      showErrorToast('Erro ao salvar a anamnese.');
    }
  },

  updateAnamnesis: async (updates) => {
    const current = get().anamnesis;
    if (!current) {
      // Se não houver cadastro prévio, salva um novo com os dados informados.
      await get().saveAnamnesis({
        chronicConditions: updates.chronicConditions ?? [''],
        allergies: updates.allergies ?? [''],
        surgeries: updates.surgeries ?? [''],
        familyHistory: updates.familyHistory ?? {
          hypertension: false,
          diabetes: false,
          heartDisease: false,
          cancer: false,
          other: '',
        },
        otherNotes: updates.otherNotes ?? '',
      });
      return;
    }

    try {
      const merged: Anamnesis = {
        ...current,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };

      await AsyncStorage.setItem(ANAMNESIS_KEY, JSON.stringify(merged));
      set({ anamnesis: merged });
    } catch (error) {
      console.error('Error updating anamnesis:', error);
      showErrorToast('Erro ao atualizar a anamnese.');
    }
  },

  exportAnamnesis: async (currentData) => {
    const userProfile = useAuthStore.getState().userProfile;

    const hasData =
      currentData.chronicConditions?.some(c => c.trim()) ||
      currentData.allergies?.some(a => a.trim()) ||
      currentData.surgeries?.some(s => s.trim()) ||
      (currentData.familyHistory && Object.values(currentData.familyHistory).some(v => v)) ||
      currentData.otherNotes?.trim();

    // Se não houver dados ou perfil de usuário, retorna false.
    if (!hasData || !userProfile) {
      return false;
    }

    try {
      const htmlContent = createAnamnesisHtml(currentData, userProfile.name ?? 'Paciente');
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Compartilhar Anamnese' });
      // Retorna true se o compartilhamento foi iniciado com sucesso.
      return true;
    } catch (error) {
      console.error('Erro ao exportar anamnese:', error);
      // Retorna false em caso de erro.
      return false;
    }
  },
}));
