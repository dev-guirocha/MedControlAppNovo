# Várias pessoas no MedControlApp — desenho

Data: 15/11/2026 · Passo 2 de 4 do plano pós-auditoria de UX/UI
(1 correções diretas ✔ · **2 várias pessoas** · 3 navegação e fluxos · 4 pasta de saúde)

## Intenção

O MedControlApp é o produto da rock.dev para **pacientes e cuidadores**, com público
frequentemente idoso. O cuidador real acompanha mais de uma pessoa — o exemplo
canônico é cuidar do **pai e da mãe**. Hoje o app só guarda dados de uma pessoa,
embora o onboarding já ofereça o perfil "Cuidador(a)".

O app continua **simples e local**: um celular tem um único usuário — ou o paciente,
ou o cuidador. Não há conexão entre aparelhos, servidor nem login.

## Objetivos

- O cuidador cadastra várias pessoas e gerencia remédios, doses, consultas e
  anamnese de cada uma.
- A tela **Hoje** mostra as doses do dia de **todas** as pessoas juntas, por horário,
  com o nome (e a cor) da pessoa bem visível em cada dose. *(decidido pelo usuário: opção A)*
- A notificação traz o nome da pessoa: **"Mãe: Losartana às 08:00"**. *(decidido pelo usuário)*
- Quem usa sozinho (paciente) não vê complexidade nova: com **uma** pessoa, nenhum
  seletor nem nome extra aparece.
- Quem já usa o app atualiza sem perder nada.

## Não-objetivos

- Sincronizar entre aparelhos, contas, convite, compartilhamento em tempo real.
- Permissões diferentes por pessoa.
- Reorganizar a navegação (abas com nome, menu do "+", formulário enxuto) — é o passo 3.
- Fotos permanentes, vários anexos por consulta, PDF da pasta de saúde — é o passo 4.

## Anti-objetivos (falharia mesmo "funcionando")

- **Dar uma dose para a pessoa errada.** Qualquer tela ou notificação em que, com 2+
  pessoas, não fique óbvio de quem é a dose é um defeito, não um detalhe visual.
- Perder ou misturar dados de quem já usa o app na migração.
- Obrigar o paciente que usa sozinho a passar por telas de "pessoas".

## Restrições

- Expo SDK 55, React Native, zustand + AsyncStorage (uma chave JSON por coleção).
- Build sempre por EAS na nuvem; projeto em fluxo bare (`android/` versionado).
- iOS está com notificações desligadas (`IOS_NOTIFICATIONS_TEMPORARILY_DISABLED`);
  o alvo de verificação é Android (Galaxy Z Fold, inclusive tela de capa 475dp).
- Dado de saúde de terceiros fica só no aparelho.
- Regras de agenda vivem em `lib/schedule.ts`; registro de dose pela notificação
  em segundo plano em `lib/doseNotificationActions.ts` — não podem quebrar.

## Abordagens consideradas

| | Abordagem | Prós | Contras |
|---|---|---|---|
| **A** ✔ | `personId` em cada registro, nas coleções que já existem | Menor mudança; migração simples; mantém zustand + AsyncStorage | Cada gravação reescreve a coleção inteira (ok: ~2 mil doses/ano para 2 pessoas) |
| B | Uma chave de armazenamento por pessoa | Isolamento | Hoje (todos juntos) e notificações carregam todo mundo de qualquer jeito; mais trabalho sem ganho |
| C | Migrar para SQLite | Melhor base para a pasta de saúde e histórico longo | Reescreve todas as stores; nova dependência nativa; migração de formato agora |

**Escolhida: A** (pelo usuário). C continua possível no futuro, e fica mais fácil com
o dono já marcado em cada registro.

## Desenho

### Modelo de dados

Nova entidade e coleção `@people`:

```ts
interface Person {
  id: string;
  name: string;          // "Mãe", "Pai", "Guilherme"
  color: string;         // da paleta medicationColors, distinta entre pessoas
  birthYear?: number;
  gender?: UserProfile['gender'];
  isSelf?: boolean;      // é quem usa o app (paciente); no máximo uma pessoa
  createdAt: string;
}
```

A pessoa com `isSelf` fica ligada ao `UserProfile`: editar nome, ano ou gênero no
perfil (edit-profile, onboarding) atualiza também essa pessoa, e com isso títulos de
notificação e PDF acompanham. *(decisão minha: evita duas fontes de verdade para o
mesmo nome)*

Passam a ter `personId: string` (obrigatório após a migração):

- `Medication`
- `DoseHistory` — gravado no `logDose` a partir do medicamento; redundante de
  propósito, para o histórico não depender de o remédio ainda existir.
- `Appointment`

Anamnese: a chave `@anamnesis` passa de um objeto para um mapa
`Record<personId, Anamnesis>`.

Ficam globais (não pertencem a pessoa): `UserProfile` (quem usa o app),
tamanho do texto, sugestões de nomes de remédio.

### Pessoa ativa

- `activePersonId` guardado no aparelho (`@active_person`), usado como filtro por
  telas "de uma pessoa" (Remédios, Histórico, Consultas, Anamnese) e como pessoa
  padrão ao cadastrar.
- Com 1 pessoa: é sempre ela, e o seletor não aparece.
- Com 2+ pessoas: seletor no topo dessas telas — chips com nome e cor.
- A tela Hoje **não** filtra: mostra todas.

### Migração (executa uma vez, na carga inicial)

1. Se `@people` não existe: cria a pessoa 1 a partir do `UserProfile`
   (nome, ano de nascimento, gênero) e a cor `medicationColors[0]`. Para usuário do
   tipo paciente, ela nasce com `isSelf: true`; para cuidador, sem `isSelf`.
2. Atribui `personId` da pessoa 1 a todo medicamento, dose e consulta sem dono.
3. Converte `@anamnesis` antigo (objeto) em `{ [pessoa1]: anamnese }`.
4. Grava uma marca de versão (`@data_version = 2`) para não repetir.
5. Precisa ser idempotente e rodar **antes** de reagendar notificações e antes de a
   task de segundo plano gravar qualquer dose (a task também chama a migração ao
   hidratar).

Para usuário do tipo cuidador já existente, a pessoa 1 nasce com o nome do próprio
cuidador; ele renomeia em Pessoas. *(decisão minha: não há como saber o nome do
paciente; perguntar na atualização seria uma tela a mais para todos)*

### Encerrar tratamento *(decidido pelo usuário)*

Hoje, excluir um remédio apaga também suas doses. Isso conflita com a pasta de
saúde: o remédio que a pessoa tomou e parou é exatamente o que o médico quer ver.

- `Medication` ganha `endedAt?: string`. **"Encerrar tratamento"** (no detalhe do
  remédio) grava a data, cancela lembretes e alerta de estoque, e tira o remédio da
  Hoje e da lista ativa de Remédios. Doses e o próprio remédio continuam guardados.
- Remédios encerrados aparecem numa seção **"Encerrados"** (em Remédios e no
  Histórico da pessoa), com "encerrado em [data]", e podem ser **retomados**
  (limpa `endedAt` e reagenda).
- **"Excluir"** continua existindo e apaga remédio e doses (para cadastro feito por
  engano), com a confirmação atual.
- Regras de agenda (`lib/schedule.ts`) tratam remédio encerrado como sem doses;
  a carga do app não reagenda lembretes de remédio encerrado.

### Tela Hoje

- Doses de todas as pessoas, ordenadas como hoje (atrasadas primeiro, depois por horário).
- Com 2+ pessoas, cada card mostra um selo com **nome + cor da pessoa** antes do
  nome do remédio, e o rótulo de acessibilidade começa pelo nome da pessoa
  ("Mãe, Losartana, 50mg, atrasada às 08:00").
- O resumo do topo (tomadas / pendentes / puladas) soma todas as pessoas.
- Saudação continua com o nome de quem usa o app (`UserProfile`).

### Notificações

O título prioriza **quem → o quê → quando**, porque a tela de capa (475dp) corta o
final; a antecedência sai do título e vai para o corpo. *(decisão minha)*

| Caso | Título (2+ pessoas) | Corpo |
|---|---|---|
| Lembrete (5 min antes) | `Mãe: Losartana às 08:00` | `Em 5 min. Toque em Tomei quando der a dose.` |
| Lembrete imediato | `Mãe: Losartana agora` | `Dose das 08:00. Toque em Tomei quando der a dose.` |
| Estoque baixo | `Mãe: estoque baixo de Losartana` | `Restam N unidades.` |

Com 1 pessoa, o título é o mesmo sem o prefixo (`Losartana às 08:00`).
- Renomear pessoa, ou passar de 1 para 2 pessoas (e de 2 para 1), reagenda as
  notificações afetadas para o título refletir o estado atual.
- Os botões "Tomei/Pulei" seguem funcionando em segundo plano; a dose herda o
  `personId` do medicamento.

### Gerenciar pessoas

- Perfil → **Pessoas**: lista com nome e cor; adicionar, editar (nome, cor, ano de
  nascimento, gênero) e excluir.
- **Proteção contra nome errado:** ao passar de 1 para 2 pessoas, o fluxo
  "Adicionar pessoa" começa confirmando o nome da pessoa 1 ("Os remédios atuais são
  de quem?", já preenchido e editável). Sem isso, um cuidador migrado veria o remédio
  da mãe chegar com o nome dele. *(decisão minha)*
- Excluir pessoa apaga remédios, doses, consultas, anamnese e notificações dela,
  com confirmação que diz isso explicitamente. Não é possível excluir a última pessoa.
- Qualquer usuário pode adicionar pessoas — o tipo escolhido no onboarding não
  limita. *(decisão minha: o paciente que passa a cuidar de alguém não fica preso)*

### Onboarding

- "Para mim": cria a pessoa 1 com os dados do próprio usuário (como na migração).
- "Para outra pessoa": depois do nome do cuidador, nova etapa
  **"Quem você vai acompanhar?"** para cadastrar a primeira pessoa (nome obrigatório;
  ano de nascimento e gênero opcionais), com "Adicionar outra" opcional.
  Os dados de gênero/ano do onboarding atual descrevem quem usa o app; para o
  cuidador, os da pessoa acompanhada são pedidos nessa nova etapa.

- **Refazer configuração inicial** com pessoas já cadastradas: o onboarding pula as
  etapas de criar pessoas (não duplica ninguém) e só atualiza os dados de quem usa o
  app; pessoas se gerenciam em Perfil → Pessoas. *(decisão minha)*

### Cadastro e edição

- Cadastro de remédio, dose avulsa e consulta usam a pessoa ativa; com 2+ pessoas,
  o formulário mostra "Para: [Mãe ▾]" no topo, trocável.
- Detalhe do remédio mostra de quem é (com 2+ pessoas).
- Anamnese e o PDF dela passam a ser da pessoa ativa, com o nome dela no PDF.

## Fica a cargo de quem constrói

- Estrutura interna das stores (nova `usePeopleStore`, seletores derivados,
  onde fica a função de migração).
- Visual exato do selo de pessoa e dos chips do seletor, respeitando contraste
  (usar `getContentColorOn`) e o tamanho de texto escolhido.
- Como garantir que a task de segundo plano e a carga do app não rodem a
  migração em paralelo de forma conflitante.
- Testes da migração e dos filtros por pessoa (lógica pura, fora do React Native,
  como os de `lib/schedule.ts`).

## Verificação esperada

- Testes da migração: dados antigos de paciente e de cuidador, rodar duas vezes,
  coleção vazia.
- No Z Fold (build EAS): usuário existente atualiza e vê os mesmos dados; cadastra
  "Pai" e "Mãe", vê ambos na Hoje com nomes; notificação chega com o nome; "Tomei"
  pela notificação registra para a pessoa certa; excluir pessoa remove só o que é dela.
