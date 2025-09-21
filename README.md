#MedControlApp
Seu assistente pessoal para o controle de medicamentos e saúde.

MedControlApp é um aplicativo móvel, construído com React Native e Expo, projetado para ajudar usuários a gerenciar seus medicamentos, agendar consultas e manter um histórico de saúde completo. O objetivo é simplificar a rotina de cuidados, garantindo que nenhum tratamento seja esquecido.

✨ Funcionalidades Principais
Gerenciamento de Medicamentos: Adicione, edite e remova medicamentos com informações detalhadas sobre dosagem, frequência e horários.

Lembretes Inteligentes: Receba notificações personalizadas para nunca mais esquecer uma dose.

Agendamento de Consultas: Mantenha um registro de todas as suas consultas médicas, com lembretes para as próximas datas.

Histórico de Doses: Registre cada dose tomada para ter um acompanhamento preciso do tratamento.

Anamnese Digital: Preencha e mantenha um histórico de saúde completo, que pode ser exportado e compartilhado com profissionais.

Perfis de Usuário: Gerencie perfis, incluindo a opção de cuidar de outras pessoas.

Suporte a Múltiplos Idiomas: Interface disponível em Português, Inglês e Espanhol.

🛠️ Tecnologias Utilizadas
Este projeto foi construído utilizando um conjunto de tecnologias modernas para o desenvolvimento móvel multiplataforma.

Framework Principal: React Native com Expo (SDK 51)

Roteamento: Expo Router

Gerenciamento de Estado: Zustand

Backend e Notificações: Firebase (App, Messaging, Storage)

Linguagem: TypeScript

Componentes de UI:

React Native Calendars para agendamentos.

Lucide Icons para iconografia.

Armazenamento Local: Async Storage

🚀 Começando
Siga estas instruções para obter uma cópia do projeto em funcionamento na sua máquina local para desenvolvimento e testes.

Pré-requisitos

Você precisará ter o Node.js, Watchman, a CLI do Expo e o ambiente de desenvolvimento iOS (Xcode) ou Android (Android Studio) configurados na sua máquina.

Node.js (versão LTS)

Expo CLI

Git

Instalação

Clone o repositório:

Bash
git clone <URL_DO_SEU_REPOSITORIO>
cd MedControlAppNovo
Instale as dependências do JavaScript:

Bash
npm install
Instale as dependências nativas do iOS:

Bash
cd ios
bundle install
bundle exec pod install
cd ..
Executando o Aplicativo

Para rodar o aplicativo em modo de desenvolvimento.

Bash
# Iniciar o Metro Bundler
npm start

# Ou rodar diretamente no iOS ou Android
npm run ios
npm run android
📜 Scripts Disponíveis
No diretório do projeto, você pode executar:

npm start: Inicia o servidor de desenvolvimento do Metro.

npm run android: Inicia o aplicativo no emulador Android ou em um dispositivo conectado.

npm run ios: Inicia o aplicativo no simulador iOS ou em um dispositivo conectado.

npm run web: Inicia o aplicativo em um navegador web.

📁 Estrutura do Projeto
A estrutura de pastas do projeto segue uma organização modular para facilitar a manutenção e escalabilidade.

/
├── android/          # Código nativo e configurações do Android
├── ios/              # Código nativo e configurações do iOS
├── app/              # Estrutura de rotas e telas (Expo Router)
│   ├── (tabs)/       # Telas principais com navegação por abas
│   ├── (modals)/     # Telas apresentadas como modais
│   └── ...
├── assets/           # Fontes, imagens e outros recursos estáticos
├── components/       # Componentes React reutilizáveis
├── constants/        # Constantes globais (cores, estilos, etc.)
├── hooks/            # Hooks customizados e stores (Zustand)
├── lib/              # Funções utilitárias e lógica de serviços
└── ...
📄 Licença
Este projeto é de propriedade privada. Todos os direitos reservados.
