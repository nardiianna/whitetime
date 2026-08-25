-- Piano editoriale Instagram Letsolv: 6 post mensili da dicembre 2026
-- a maggio 2027, mix brand / team / case study prodotto / processo.
-- image_url è un placeholder (placehold.co) da sostituire con l'asset reale
-- prima della pubblicazione; la direzione creativa è in internal_note.

insert into editorial_plan_items
  (page_id, scheduled_date, status, social, theme, format, caption, image_url, internal_note)
select id, v.scheduled_date, v.status, v.social, v.theme, v.format, v.caption, v.image_url, v.internal_note
from pages, (
  values
  (
    date '2026-12-09', 'da_fare', array['Instagram'],
    'Let''s Solve. Let''s Design. Let''s Inspire. — il manifesto Letsolv',
    'Statica (tipografia bold)',
    E'Risolvere un problema, progettare una soluzione, ispirare chi la userà: è il percorso che seguiamo in ogni progetto di design industriale.\n\nLet''s Solve. Let''s Design. Let''s Inspire.\n\nScopri chi siamo su letsolv.it (link in bio).\n\n#Letsolv #DesignIndustriale #ProductDesign #Ingegneria #Innovazione #MadeInItaly #IndustrialDesign',
    'https://placehold.co/1080x1080/1a1aff/f5efe0?text=Post+1+-+Lets+Solve',
    'Grafica statica quadrata, sfondo blu cobalto pieno, tipografia bold sans-serif crema/bianca, stesso stile del contenuto "LET''S SOLVE. LET''S DESIGN. LET''S INSPIRE." già in archivio. Nessuna foto, solo tipografia.'
  ),
  (
    date '2027-01-13', 'da_fare', array['Instagram'],
    'Le persone dietro ai progetti Letsolv',
    'Carosello (ritratti team)',
    E'Dietro ogni concept, ogni analisi FEM, ogni prototipo che vedete qui c''è un team che intreccia competenze diverse — design, ingegneria, sviluppo prodotto.\n\nSkills, intertwining perspectives and expanding vision: è così che nascono le nostre soluzioni.\n\nScorri per conoscere alcune delle persone di Letsolv. 👋\n\n#Letsolv #TeamLetsolv #DesignIndustriale #Ingegneria #ProductDesign #MadeInItaly',
    'https://placehold.co/1080x1080/f5efe0/1a1aff?text=Post+2+-+Team+Letsolv',
    'Carosello 4-6 slide, un ritratto per slide, stesso trattamento grafico già in uso: foto b/n con doodle a mano libera (linee rosa/blu) sovrapposti e nome scritto a mano nell''angolo. Sfondo alternato crema/blu cobalto come nel feed esistente.'
  ),
  (
    date '2027-02-10', 'da_fare', array['Instagram'],
    'LatoBlu: quando una sedia diventa un progetto di ingegneria',
    'Carosello (prodotto)',
    E'LatoBlu nasce da una domanda semplice: quanto si può alleggerire una sedia in lamiera senza comprometterne la resistenza?\n\nDal render al prototipo, dal calcolo strutturale al pezzo finito: un progetto che unisce estetica e ingegneria dei materiali.\n\nScorri per vedere il processo. ➡️\n\n#Letsolv #LatoBlu #ProductDesign #DesignIndustriale #Ingegneria #MadeInItaly #IndustrialDesign',
    'https://placehold.co/1080x1080/f5efe0/1a1a1a?text=Post+3+-+LatoBlu',
    'Carosello 3 slide: 1) render della sedia LatoBlu (materiale già in archivio), 2) dettaglio della struttura/pattern traforato, 3) foto del prototipo fisico se disponibile. Sfondo neutro chiaro, coerente con il render già pubblicato.'
  ),
  (
    date '2027-03-10', 'da_fare', array['Instagram'],
    'Prima di produrre, si simula: l''analisi FEM',
    'Carosello tecnico',
    E'Ogni progetto passa da una fase di analisi strutturale prima di arrivare in produzione: simulazioni FEM per individuare criticità, ottimizzare i materiali e ridurre gli scarti.\n\nÈ il modo in cui trasformiamo un''idea in un prodotto industrializzabile, senza sorprese in fase di produzione.\n\n#Letsolv #AnalisiFEM #Ingegneria #Prototipazione #DesignIndustriale #Innovazione',
    'https://placehold.co/1080x1080/1a1aff/f5efe0?text=Post+4+-+Analisi+FEM',
    'Foto/screen di un modello FEM con mappa di calore (stress/deformazione) su software CAE, affiancato se possibile al componente fisico corrispondente. Se non disponibile materiale FEM reale, usare uno schizzo tecnico annotato a mano, stile "Ideas flow" già in archivio.'
  ),
  (
    date '2027-04-14', 'da_fare', array['Instagram'],
    'Design su misura per la logistica: il progetto AMR',
    'Carosello (render/prodotto)',
    E'Un veicolo a guida autonoma (AMR) per la logistica ha esigenze molto diverse da un prodotto di consumo: ergonomia di manutenzione, resistenza agli urti, integrazione dei sensori.\n\nAbbiamo lavorato al design di un AMR su misura, dal concept alla fattibilità produttiva.\n\n#Letsolv #AMR #Logistica #DesignIndustriale #ProductDesign #Innovazione #Ingegneria',
    'https://placehold.co/1080x1080/f5efe0/1a1aff?text=Post+5+-+Progetto+AMR',
    'Carosello 2-3 slide con render/foto del progetto AMR. ATTENZIONE: verificare eventuali vincoli di NDA con il cliente finale prima di pubblicare immagini reali del veicolo; in alternativa usare schizzo/wireframe concettuale non riservato.'
  ),
  (
    date '2027-05-12', 'da_fare', array['Instagram'],
    'Ideas flow where minds connect',
    'Statica (valori)',
    E'Le soluzioni migliori nascono quando prospettive diverse si intrecciano: design, ingegneria, sostenibilità, strategia di prodotto.\n\nÈ il principio su cui costruiamo ogni progetto: non partiamo da una risposta, partiamo da una conversazione.\n\nIdeas flow where minds connect.\n\n#Letsolv #Innovazione #Sostenibilita #DesignIndustriale #ProductDesign #MadeInItaly',
    'https://placehold.co/1080x1080/f5efe0/1a1a1a?text=Post+6+-+Ideas+Flow',
    'Grafica statica ispirata al contenuto "IDEAS FLOW WHERE MINDS CONNECT" già in archivio: sfondo crema, tipografia serif elegante nera, dettaglio a nastro blu decorativo. In alternativa riusare l''illustrazione "the best solutions are born from connecting" (testa/fiori) se disponibile in alta risoluzione.'
  )
) as v(scheduled_date, status, social, theme, format, caption, image_url, internal_note)
where pages.name = 'Letsolv';
