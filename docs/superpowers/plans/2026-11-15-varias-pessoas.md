# Várias pessoas — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** permitir que um cuidador gerencie remédios, doses, consultas e anamnese de várias pessoas no mesmo aparelho, sem mudar a experiência de quem usa sozinho.

**Architecture:** cada registro ganha `personId` nas coleções AsyncStorage existentes (abordagem A). Uma migração idempotente atribui tudo à pessoa 1. Lógica nova fica em módulos puros testáveis (`lib/people.ts`, `lib/migration.ts`); a orquestração entre stores fica em `lib/personActions.ts` para evitar imports circulares.

**Tech Stack:** Expo SDK 55, React Native 0.83, expo-router, zustand 4, AsyncStorage, expo-notifications, TypeScript 5.9. Testes de lógica pura com `node:test` + `tsx` (Node 22).

**Spec:** `docs/superpowers/specs/2026-11-15-varias-pessoas-design.md`

## Global Constraints

- Sem servidor, sem login, sem sincronização: tudo em AsyncStorage no aparelho.
- Com **1** pessoa, nenhum seletor, selo ou prefixo de nome aparece em lugar nenhum.
- Notificação (2+ pessoas): `Mãe: Losartana às 08:00` / corpo `Em 5 min. Toque em Tomei quando der a dose.`; imediata `Mãe: Losartana agora` / `Dose das 08:00. Toque em Tomei quando der a dose.`; estoque `Mãe: estoque baixo de Losartana` / `Restam N unidades.` Com 1 pessoa, o mesmo sem `Mãe: ` (estoque: `Estoque baixo de Losartana`).
- Antecedência do lembrete continua `REMINDER_LEAD_MINUTES = 5`.
- Chaves novas: `@people`, `@active_person`, `@data_version` (valor `'2'`).
- Cores de pessoa vêm de `medicationColors` (constants/theme.ts); texto sobre cor usa `getContentColorOn`.
- Textos de tamanho seguem `getFontSize(fontScale)`; botões só de ícone têm `accessibilityLabel`.
- Build por EAS na nuvem; não instalar Android SDK nem buildar localmente.
- Módulos de lógica pura (`lib/people.ts`, `lib/migration.ts`, `lib/schedule.ts`) não importam React Native nem stores; só `import type`.

## Review Focus

1. **Tocar "Tomei" na notificação antes de abrir o app atualizado** (task de segundo plano roda sobre dados v1): a dose deve ser gravada já com `personId`, porque a hidratação roda a migração antes — teste na Task 3.
2. **Excluir a pessoa ativa**: a pessoa ativa passa para a primeira restante e nenhuma tela fica filtrando por um id inexistente — teste na Task 6 (`resolveActivePersonId`).
3. **Remédio encerrado**: não gera dose na Hoje, não reagenda lembrete ao abrir o app, e volta a ter lembrete ao retomar — teste na Task 4 (`isScheduledOnDate` com `endedAt`).
4. **Editar um remédio** não pode perder `personId` nem `endedAt` (o formulário não envia esses campos) — teste na Task 4 (`mergeMedicationUpdate`).
5. **Passar de 2 para 1 pessoa** remove o prefixo do nome das notificações — teste na Task 6 (`needsRescheduleOnPeopleChange`).

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `lib/people.ts` (novo) | Regras puras de pessoa: títulos de notificação, cor, quando mostrar nomes, pessoa ativa |
| `lib/migration.ts` (novo) | Migração pura v1→v2 sobre um snapshot dos dados |
| `lib/dataMigration.ts` (novo) | Lê/grava AsyncStorage e executa `migrateToV2` uma vez (guarda por promise) |
| `lib/personActions.ts` (novo) | Orquestra entre stores: adicionar/renomear/excluir pessoa, reagendar |
| `hooks/usePeopleStore.tsx` (novo) | Estado de pessoas e pessoa ativa |
| `components/PersonSelector.tsx` (novo) | Chips de pessoa; não renderiza com < 2 pessoas |
| `app/(modals)/people/*` (novo) | Lista e edição de pessoas |
| `app/(onboarding)/step3b-people.tsx` (novo) | "Quem você vai acompanhar?" |
| `lib/__tests__/*.test.ts` (novo) | Testes de lógica pura |
| `types/medication.ts`, `src/constants/keys.ts` | Tipos e chaves |
| stores em `hooks/`, `lib/schedule.ts`, `lib/notifications.ts`, `lib/doseNotificationActions.ts` | Passam a respeitar `personId`/`endedAt` |
| telas em `app/` e `components/MedicationCard.tsx` | Filtro, selo, seletor, encerrar |

---

### Task 1: Base de testes, tipos e regras puras de pessoa

**Files:**
- Modify: `package.json` (devDependency `tsx`, script `test`)
- Modify: `types/medication.ts`, `src/constants/keys.ts`
- Create: `lib/people.ts`, `lib/__tests__/people.test.ts`
- Move: `lib/__tests__/schedule.test.ts` (portar os 11 casos de `scratchpad/test-schedule.js` para `node:test`)

**Interfaces:**
- Produces:
  - `interface Person { id: string; name: string; color: string; birthYear?: number; gender?: UserProfile['gender']; isSelf?: boolean; createdAt: string }`
  - `Medication.personId: string`, `Medication.endedAt?: string`, `DoseHistory.personId?: string`, `Appointment.personId: string`
  - keys `PEOPLE_KEY = '@people'`, `ACTIVE_PERSON_KEY = '@active_person'`, `DATA_VERSION_KEY = '@data_version'`
  - `shouldShowPersonNames(people: Person[]): boolean` (true se `length >= 2`)
  - `pickPersonColor(people: Person[], palette: string[]): string` — primeira cor da paleta não usada; se todas usadas, `palette[people.length % palette.length]`
  - `type ReminderKind = 'lead' | 'now' | 'stock'`
  - `buildNotificationText(input: { kind: ReminderKind; personName: string | null; medicationName: string; time?: string; leadMinutes?: number; stock?: number }): { title: string; body: string }`
  - `resolveActivePersonId(people: Person[], storedId: string | null): string | null`

- [ ] **Step 1:** `npm install -D tsx --legacy-peer-deps`; script `"test": "node --import tsx --test lib/__tests__/*.test.ts"`.
- [ ] **Step 2: Testes que falham** em `lib/__tests__/people.test.ts`:
  - `buildNotificationText({kind:'lead', personName:'Mãe', medicationName:'Losartana', time:'08:00', leadMinutes:5})` → `{title:'Mãe: Losartana às 08:00', body:'Em 5 min. Toque em Tomei quando der a dose.'}`
  - mesmo com `personName:null` → título `'Losartana às 08:00'`
  - `kind:'now'` → `{title:'Mãe: Losartana agora', body:'Dose das 08:00. Toque em Tomei quando der a dose.'}`
  - `kind:'stock', stock:3` → `{title:'Mãe: estoque baixo de Losartana', body:'Restam 3 unidades.'}`; sem pessoa → `'Estoque baixo de Losartana'`
  - `pickPersonColor([], P)` → `P[0]`; com pessoa usando `P[0]` → `P[1]`
  - `resolveActivePersonId([a,b], b.id)` → `b.id`; `([a,b], 'sumiu')` → `a.id`; `([], x)` → `null`
  - `shouldShowPersonNames([a])` → false; `([a,b])` → true
- [ ] **Step 3:** `npm test` → falha (módulo inexistente).
- [ ] **Step 4:** implementar `lib/people.ts`, tipos e chaves; portar testes de agenda.
- [ ] **Step 5:** `npm test` → todos passam; `npx tsc --noEmit -p .` → sem erros. Nesta task `personId` entra **opcional** nos tipos (`personId?: string`) para o projeto seguir compilando; a Task 5 o torna obrigatório em `Medication` e `Appointment`.
- [ ] **Step 6:** commit `feat(people): types, pure person rules and test runner`.

### Task 2: Migração pura v1 → v2

**Files:** Create `lib/migration.ts`, `lib/__tests__/migration.test.ts`

**Interfaces:**
- Consumes: `Person`, `pickPersonColor` (Task 1)
- Produces:
  - `interface DataSnapshot { version: string | null; profile: UserProfile | null; people: Person[] | null; medications: Medication[]; doseHistory: DoseHistory[]; appointments: Appointment[]; anamnesis: Anamnesis | Record<string, Anamnesis> | null }`
  - `migrateToV2(snapshot: DataSnapshot, deps: { newId: () => string; now: () => string; palette: string[] }): DataSnapshot & { version: '2'; people: Person[]; anamnesis: Record<string, Anamnesis> }`

- [ ] **Step 1: Testes que falham:**
  - paciente com 2 remédios, 3 doses, 1 consulta, anamnese objeto → 1 pessoa `{name: profile.name, isSelf:true, color: palette[0], birthYear, gender}`; todos os registros com `personId` dela; `anamnesis` = `{[id]: anamneseAntiga}`; `version:'2'`
  - cuidador → pessoa 1 com nome do perfil e **sem** `isSelf`
  - rodar `migrateToV2` sobre o resultado → saída idêntica (idempotente; não cria 2ª pessoa)
  - snapshot vazio sem perfil → 1 pessoa `{name:'Eu'}`, coleções vazias, `anamnesis:{}`
  - dose de remédio já excluído (medicationId órfão) → recebe `personId` da pessoa 1
  - registros que já têm `personId` válido não são alterados
- [ ] **Step 2:** `npm test` → falha.
- [ ] **Step 3:** implementar `migrateToV2` (pura; anamnese é objeto antigo quando tem campo `chronicConditions`).
- [ ] **Step 4:** `npm test` → passa.
- [ ] **Step 5:** commit `feat(people): pure v1→v2 data migration`.

### Task 3: Executar a migração e store de pessoas

**Files:**
- Create: `lib/dataMigration.ts`, `hooks/usePeopleStore.tsx`
- Modify: `app/_layout.tsx` (rodar migração antes de `Promise.all(load…)` e carregar pessoas), `lib/doseNotificationActions.ts` (`hydrateDoseStoresFromStorage` chama a migração primeiro)

**Interfaces:**
- Consumes: `migrateToV2`, `resolveActivePersonId`
- Produces:
  - `ensureDataMigrated(): Promise<void>` — lê as chaves, roda `migrateToV2` se `@data_version !== '2'`, grava tudo, depois a versão por último; promise de módulo garante uma execução por runtime
  - `usePeopleStore`: `{ people: Person[]; activePersonId: string | null; loadPeople(): Promise<void>; setActivePerson(id: string): Promise<void>; savePeople(next: Person[]): Promise<void> }` — `activePersonId` sempre passa por `resolveActivePersonId`
  - `getPersonName(personId: string): string | null` (helper exportado do store)

- [ ] **Step 1: Teste que falha** (Review Focus 1) em `lib/__tests__/migration.test.ts`: `migrateToV2` aplicado a um snapshot v1 em que `doseHistory` ganhou uma entrada nova sem `personId` (simula task gravando) → entrada recebe `personId` da pessoa 1. *(A garantia de ordem — migrar antes de gravar — fica no código de `hydrateDoseStoresFromStorage`; o teste fixa que a migração cobre o caso.)*
- [ ] **Step 2:** implementar `ensureDataMigrated` e o store; ligar em `_layout.tsx` e em `hydrateDoseStoresFromStorage`.
- [ ] **Step 3:** `npm test` e `npx tsc --noEmit -p .` passam.
- [ ] **Step 4:** commit `feat(people): run migration on load and people store`.

### Task 4: Remédios e doses por pessoa, encerrar tratamento, notificações com nome

**Files:**
- Modify: `lib/schedule.ts`, `lib/__tests__/schedule.test.ts`, `hooks/useMedicationStore.tsx`, `hooks/useDoseHistoryStore.tsx`, `lib/notifications.ts`

**Interfaces:**
- Consumes: `buildNotificationText`, `shouldShowPersonNames`, `getPersonName`
- Produces:
  - `isScheduledOnDate` retorna `false` se `medication.endedAt` existe
  - `mergeMedicationUpdate(current: Medication, updates: Partial<Medication>): Medication` em `lib/schedule.ts` — nunca troca `personId`, `id`, `createdAt`; mantém `endedAt` se `updates` não o traz
  - `useMedicationStore.addMedication(data: Omit<Medication,'id'|'createdAt'|'endedAt'>)` (exige `personId`)
  - `useMedicationStore.endMedication(id): Promise<void>` / `resumeMedication(id): Promise<void>`
  - `useMedicationStore.rescheduleAll(): Promise<void>`
  - `scheduleMedicationNotifications(med, { requestPermissions?, allowCatchUp?, personName: string | null })` e `scheduleStockNotification(med, { requestPermissions?, personName: string | null })`
  - `DoseHistory` gravada por `logDose` inclui `personId: med.personId`

- [ ] **Step 1: Testes que falham:**
  - `isScheduledOnDate({...diaria, endedAt:'2026-11-10T00:00:00Z'}, qualquerData)` → false; `listDoseDates` → `[]`
  - `mergeMedicationUpdate({...m, personId:'p1', endedAt:'X'}, {name:'Novo'})` → `personId:'p1'`, `endedAt:'X'`, `name:'Novo'`
  - `mergeMedicationUpdate(m, {personId:'p2'})` → `personId` continua o original
- [ ] **Step 2:** `npm test` → falha.
- [ ] **Step 3:** implementar regras puras; no store: `updateMedication` usa `mergeMedicationUpdate`; `loadMedications` não agenda remédio encerrado; `endMedication` grava `endedAt`, cancela lembretes e estoque; `resumeMedication` limpa e reagenda; títulos via `buildNotificationText` com `personName` = nome só se `shouldShowPersonNames`.
- [ ] **Step 4:** `npm test` e `npx tsc --noEmit -p .` passam.
- [ ] **Step 5:** commit `feat(people): medications per person, end treatment, named notifications`.

### Task 5: Consultas e anamnese por pessoa

**Files:** Modify `hooks/useAppointmentStore.tsx`, `hooks/useAnamnesisStore.tsx`, `app/(modals)/anamnesis/index.tsx`

**Interfaces:**
- Produces:
  - `addAppointment(data: Omit<Appointment,'id'|'createdAt'>)` exige `personId`
  - `useAnamnesisStore`: `{ anamnesisByPerson: Record<string, Anamnesis>; getAnamnesis(personId): Anamnesis | null; saveAnamnesis(personId, data); exportAnamnesis(personId, data) }` — PDF usa o nome da pessoa, não o do perfil

- [ ] **Step 1:** implementar; tela de anamnese usa a pessoa ativa (o seletor entra na Task 7).
- [ ] **Step 2:** tornar `personId` obrigatório em `Medication` e `Appointment`; corrigir os chamadores apontados pelo tsc usando a pessoa ativa (`usePeopleStore.getState().activePersonId`) — a Task 8 depois troca isso pela escolha "Para:".
- [ ] **Step 3:** `npx tsc --noEmit -p .` passa.
- [ ] **Step 4:** commit `feat(people): appointments and anamnesis per person`.

### Task 6: Ações sobre pessoas (adicionar, renomear, excluir)

**Files:** Create `lib/personActions.ts`; Modify `lib/people.ts`, `lib/__tests__/people.test.ts`

**Interfaces:**
- Consumes: stores das Tasks 3–5, `rescheduleAll`
- Produces:
  - puros em `lib/people.ts`: `removePersonFromSnapshot(snapshot: Pick<DataSnapshot,'medications'|'doseHistory'|'appointments'|'anamnesis'>, personId: string)` e `needsRescheduleOnPeopleChange(before: Person[], after: Person[]): boolean` (true se cruzou 1↔2+ ou se o nome de alguém mudou)
  - `addPerson(input: Omit<Person,'id'|'createdAt'|'color'> & { color?: string }): Promise<Person>`
  - `updatePerson(id: string, updates: Partial<Omit<Person,'id'|'createdAt'>>): Promise<void>`
  - `deletePerson(id: string): Promise<void>` — recusa se for a última; cancela notificações dos remédios dela; remove dados; pessoa ativa via `resolveActivePersonId`

- [ ] **Step 1: Testes que falham:**
  - `removePersonFromSnapshot` remove só registros de `p2` e a chave `p2` da anamnese
  - `needsRescheduleOnPeopleChange([a],[a,b])` → true; `([a,b],[a])` → true; `([a,b],[a,b])` → false; renomear `b` → true
  - `resolveActivePersonId([a], idDeBExcluida)` → `a.id` (Review Focus 2)
- [ ] **Step 2:** `npm test` → falha; implementar; `addPerson`, `updatePerson` e `deletePerson` comparam pessoas antes/depois com `needsRescheduleOnPeopleChange` e, se true, chamam `useMedicationStore.getState().rescheduleAll()`; `npm test` passa.
- [ ] **Step 3:** ligar sync do `isSelf`: `useAuthStore.updateUserProfile` chama `updatePerson(self.id, {name, birthYear, gender})` quando esses campos mudam (via `personActions`, sem import circular).
- [ ] **Step 4:** `npx tsc --noEmit -p .` passa; commit `feat(people): add, rename and delete people`.

### Task 7: Seletor, selo na Hoje e listas filtradas

**Files:**
- Create: `components/PersonSelector.tsx`
- Modify: `components/MedicationCard.tsx`, `app/(tabs)/home.tsx`, `app/(tabs)/medicamentos.tsx`, `app/(tabs)/historico.tsx`, `app/(tabs)/consultas.tsx`, `app/(modals)/anamnesis/index.tsx`, `app/medication/[id].tsx`

**Interfaces:**
- Produces:
  - `<PersonSelector />` — lê/grava `activePersonId`; `null` se `people.length < 2`; chips com nome + cor, `accessibilityRole="radio"` e estado selecionado
  - `MedicationCard` prop `person?: { name: string; color: string }` — selo antes do nome; `accessibilityLabel` começa com o nome da pessoa

- [ ] **Step 1:** Hoje: doses de todos; selo só com 2+ pessoas; resumo soma todos.
- [ ] **Step 2:** Remédios: filtra pela ativa; seção "Encerrados" (com `encerrado em dd/mm/aaaa`) abaixo dos ativos.
- [ ] **Step 3:** Histórico e Consultas: filtram pela ativa (dose usa `personId` da entrada). Histórico mostra remédios encerrados da pessoa.
- [ ] **Step 4:** Detalhe do remédio: nome da pessoa (2+), botões "Encerrar tratamento" (confirmação explicando que o histórico fica) e, se encerrado, "Retomar tratamento".
- [ ] **Step 5:** `npx tsc --noEmit -p .` e `npx expo export --platform android` passam; commit `feat(people): selector, badges and filtered lists`.

### Task 8: Cadastros com "Para:"

**Files:** Modify `app/(modals)/add-medication/form.tsx`, `confirm.tsx`, `logAsNeeded.tsx`, `app/(modals)/add-appointment/index.tsx`

- [ ] **Step 1:** com 2+ pessoas, linha "Para: [Mãe ▾]" no topo; padrão = pessoa ativa; `personId` vai como parâmetro para `confirm` e para `addMedication`/`addAppointment`. Na **edição** o campo aparece só como texto (não troca dono — ver `mergeMedicationUpdate`).
- [ ] **Step 2:** `npx tsc --noEmit -p .` passa; commit `feat(people): choose person when adding`.

### Task 9: Telas de Pessoas

**Files:** Create `app/(modals)/people/_layout.tsx`, `index.tsx`, `edit.tsx`; Modify `app/(tabs)/profile.tsx`, `app/_layout.tsx` (registrar rota modal)

- [ ] **Step 1:** Perfil → item "Pessoas" abre a lista (nome, cor, "você" para `isSelf`), botão "Adicionar pessoa".
- [ ] **Step 2:** `edit.tsx`: nome (obrigatório), cor (paleta, com `getContentColorOn`), ano de nascimento, gênero; excluir com confirmação `Excluir <nome>? Remédios, doses, consultas e anamnese de <nome> serão apagados. Essa ação não pode ser desfeita.`; sem excluir a última.
- [ ] **Step 3:** **Confirmação da pessoa 1**: ao adicionar quando existe só 1 pessoa, primeira tela pergunta `Os remédios atuais são de quem?` com o nome atual preenchido e editável; salva (`updatePerson`) e segue para a nova pessoa.
- [ ] **Step 4:** `npx tsc --noEmit -p .` passa; commit `feat(people): manage people screens`.

### Task 10: Onboarding e "Refazer configuração inicial"

**Files:** Create `app/(onboarding)/step3b-people.tsx`; Modify `step2-profile-type.tsx`, `step3-name.tsx`, `step4-details.tsx`, `step6-complete.tsx`, `app/(onboarding)/_layout.tsx`

- [ ] **Step 1:** se já existem pessoas (refazer configuração), nenhuma etapa cria pessoa; só atualiza `UserProfile` (e a pessoa `isSelf` pelo sync da Task 6).
- [ ] **Step 2:** "Para mim" sem pessoas: `step6` cria pessoa `isSelf` com dados do perfil.
- [ ] **Step 3:** "Para outra pessoa" sem pessoas: após `step4`, `step3b-people` — título `Quem você vai acompanhar?`, nome obrigatório, ano/gênero opcionais, botão `Adicionar outra`; cria as pessoas sem `isSelf`.
- [ ] **Step 4:** `npx tsc --noEmit -p .` passa; commit `feat(people): onboarding for caregivers`.

### Task 11: Verificação final

- [ ] **Step 1:** `npm test` — todos passam.
- [ ] **Step 2:** `npx tsc --noEmit -p .` — sem erros.
- [ ] **Step 3:** `npx expo export --platform android --output-dir <scratchpad>` — gera o `.hbc`.
- [ ] **Step 4:** registrar no PR/commit o roteiro do Z Fold (após `eas build -p android --profile preview`, conferindo a conta com `eas whoami`): atualizar sobre dados existentes e ver os mesmos dados; cadastrar Pai e Mãe; Hoje com selos; notificação com nome; "Tomei" pela notificação grava na pessoa certa; encerrar e retomar; excluir pessoa remove só o que é dela.
