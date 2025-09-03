import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Anamnesis } from '@/types/medication';
import { Alert } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import * as Sharing from 'expo-sharing';

const ANAMNESIS_KEY = '@anamnesis';

interface AnamnesisState {
  anamnesis: Anamnesis | null;
  isLoadingAnamnesis: boolean;
  loadAnamnesis: () => Promise<void>;
  saveAnamnesis: (data: Omit<Anamnesis, 'id' | 'lastUpdated'>) => Promise<void>;
  exportAnamnesis: () => Promise<void>;
}

export const useAnamnesisStore = create<AnamnesisState>((set, get) => ({
  anamnesis: null,
  isLoadingAnamnesis: true,

  loadAnamnesis: async () => {
    try {
      const storedAnamnesis = await AsyncStorage.getItem(ANAMNESIS_KEY);
      if (storedAnamnesis) {
        set({ anamnesis: JSON.parse(storedAnamnesis) });
      }
    } catch (error) {
      console.error('Error loading anamnesis:', error);
    } finally {
      set({ isLoadingAnamnesis: false });
    }
  },

  saveAnamnesis: async (data) => {
    try {
      const anamnesisToSave: Anamnesis = {
        ...data,
        id: 'anamnesis-id',
        lastUpdated: new Date().toISOString(),
      };
      await AsyncStorage.setItem(ANAMNESIS_KEY, JSON.stringify(anamnesisToSave));
      set({ anamnesis: anamnesisToSave });
    } catch (error) {
      console.error('Error saving anamnesis:', error);
    }
  },

  exportAnamnesis: async () => {
    const anamnesisData = get().anamnesis;
    if (!anamnesisData) {
      Alert.alert('Erro', 'Nenhum dado de anamnese para exportar.');
      return;
    }

    // Função para formatar os dados em HTML
    const generateHtml = () => {
      const { chronicConditions, allergies, surgeries, familyHistory, otherNotes, lastUpdated } = anamnesisData;
      
      const formatArray = (arr: string[]) => arr.filter(item => item.trim() !== '').map(item => `<li>${item}</li>`).join('');

      return `
        <html>
          <body>
            <h1>Questionário de Anamnese</h1>
            <p>Última atualização: ${new Date(lastUpdated).toLocaleDateString('pt-BR')}</p>
            
            <h2>Condições de Saúde</h2>
            <p>Condições Crônicas:</p>
            <ul>${formatArray(chronicConditions)}</ul>
            <p>Alergias:</p>
            <ul>${formatArray(allergies)}</ul>
            
            <h2>Histórico Pessoal</h2>
            <p>Cirurgias Prévias:</p>
            <ul>${formatArray(surgeries)}</ul>
            
            <h2>Histórico Familiar</h2>
            <ul>
              <li>Hipertensão: ${familyHistory.hypertension ? 'Sim' : 'Não'}</li>
              <li>Diabetes: ${familyHistory.diabetes ? 'Sim' : 'Não'}</li>
              <li>Doenças Cardíacas: ${familyHistory.heartDisease ? 'Sim' : 'Não'}</li>
              <li>Câncer: ${familyHistory.cancer ? 'Sim' : 'Não'}</li>
              ${familyHistory.other ? `<li>Outros: ${familyHistory.other}</li>` : ''}
            </ul>
            
            <h2>Notas Adicionais</h2>
            <p>${otherNotes || 'Nenhuma nota adicional.'}</p>
          </body>
        </html>
      `;
    };

    // Opções de geração do PDF
    const options = {
      html: generateHtml(),
      fileName: 'Anamnese_MedControl',
      directory: 'docs',
    };

    try {
      // 1. Gera o arquivo PDF
      const file = await RNHTMLtoPDF.convert(options);
      
      // 2. Verifica se o compartilhamento é possível
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        // 3. Abre a janela de compartilhamento nativa
        await Sharing.shareAsync(file.filePath);
      } else {
        Alert.alert('Erro', 'A função de compartilhamento não está disponível no seu dispositivo.');
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      Alert.alert('Erro', 'Não foi possível gerar o arquivo. Tente novamente.');
    }
  },
}));