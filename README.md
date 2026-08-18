# WhiteTime — pianificazione post + reminder Telegram

Pianifica i contenuti per Pallavolo, Centro Sportivo e Magnetica Design da telefono o computer.
Niente pubblicazione automatica su Instagram (serve il Business Manager, non disponibile per
questi account) — l'app manda un promemoria su Telegram all'orario previsto, con caption e
immagine pronte, e la pubblicazione resta manuale.

## Struttura

```
supabase/
  migrations/   schema Postgres (pages, posts, content_ideas), RLS, bucket storage, scheduling
  functions/
    send-reminders/   Edge Function chiamata ogni minuto dal cron, invia i messaggi Telegram
web/            frontend React (Vite + Tailwind), parla direttamente con Supabase
```

## Setup — passi da fare una volta sola

### 1. Crea il progetto Supabase

1. Vai su [supabase.com](https://supabase.com) → crea un account/progetto (piano Free va bene).
2. In **Project Settings → API** annota: `Project URL`, `anon public key`, `service_role key`.

### 2. Installa la CLI Supabase e collega il progetto

```bash
brew install supabase/tap/supabase   # oppure: npm install -g supabase
cd instagram-planner
supabase login
supabase link --project-ref <il-tuo-project-ref>
```

### 3. Applica lo schema del database

```bash
supabase db push
```

Questo crea le tabelle (`pages` già popolata con Pallavolo / Centro Sportivo / Magnetica Design),
le policy di sicurezza, il bucket storage `media` e lo scheduling ogni minuto.

### 4. Crea il bot Telegram

1. Su Telegram cerca **@BotFather**, invia `/newbot` e segui le istruzioni → ottieni il **token**.
2. Scrivi un messaggio qualsiasi al tuo nuovo bot (per attivare la chat).
3. Apri nel browser `https://api.telegram.org/bot<TOKEN>/getUpdates` e leggi il campo `chat.id`
   nella risposta JSON → questo è il tuo **chat id**.

### 5. Deploya la Edge Function e imposta i secret

```bash
supabase functions deploy send-reminders
supabase secrets set TELEGRAM_BOT_TOKEN=<token-botfather> TELEGRAM_CHAT_ID=<il-tuo-chat-id>
```

Poi, nell'**SQL Editor** del dashboard Supabase, esegui (sostituendo i valori reali):

```sql
select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/send-reminders', 'edge_function_url');
select vault.create_secret('<service-role-key>', 'edge_function_service_role_key');
```

Questi due secret servono al cron interno (`pg_cron`) per chiamare la funzione ogni minuto senza
scrivere chiavi in chiaro nel codice.

### 6. Crea il tuo utente di accesso

Dashboard Supabase → **Authentication → Users → Add user** → email + password. Dopo il primo
`supabase db push` questo utente diventa automaticamente admin (vede e gestisce tutto).

### 7. Configura ed esegui il frontend

```bash
cd web
cp .env.example .env
# apri .env e incolla Project URL + anon public key
npm install
npm run dev
```

Per l'uso da telefono e computer, deploya `web/` su [Vercel](https://vercel.com) o
[Netlify](https://netlify.com) (free tier), impostando le stesse due variabili d'ambiente
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) nel pannello del provider scelto.

## Verifica end-to-end

1. Accedi con l'utente creato al punto 6.
2. Crea un post di test su una pagina, con un'immagine, orario tra ~2 minuti.
3. Entro qualche minuto deve arrivare un messaggio Telegram con foto e caption pronta; lo stato
   del post nell'app passa a "Promemoria inviato".
4. Dopo aver pubblicato manualmente su Instagram, apri l'app e premi "Segna pubblicato".

## Area clienti (Piano Editoriale + Report)

Ogni pagina cliente (tipo `client`, es. Magnetica Design) può avere uno o più accessi cliente
dedicati, separati dal tuo login admin: chi accede come cliente vede solo la sua pagina, con due
sezioni — **Piano Editoriale** (contenuti pianificati, con possibilità di lasciare una nota per
ciascuno) e **Report** (risultati campagne Meta Ads che inserisci tu, in sola lettura per il
cliente).

Per dare accesso a un cliente:

1. Dashboard Supabase → **Authentication → Users → Add user** → crea email + password per il cliente.
2. Copia l'**UID** dell'utente appena creato (visibile nella lista utenti).
3. Nell'app, apri "✎" sulla pagina del cliente (bottone di modifica accanto al suo nome) → nel
   pannello **Accessi cliente** in fondo al form, incolla l'UID e premi "Collega".
4. Comunica al cliente le credenziali create al punto 1: al login vedrà solo il suo Piano
   Editoriale e i suoi Report, mai i dati degli altri clienti.

Per gestire i contenuti del piano e i report di un cliente, selezionalo dai filtri in alto: sotto
il calendario/elenco comparirà "Piano Editoriale (cliente)" e "Report Meta Ads".

## Come funziona il reminder

`supabase/functions/send-reminders/index.ts` gira ogni minuto (schedulato dalla migration
`20260716000100_schedule_reminders.sql` via `pg_cron` + `pg_net`), cerca i post con
`scheduled_at` nei prossimi 5 minuti non ancora "ricordati", manda il messaggio Telegram
(foto + caption se c'è un'immagine, altrimenti solo testo) e marca il post come
`promemoria_inviato`.
