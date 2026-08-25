-- Piano editoriale Instagram Formest: 12 post quindicinali da dicembre 2026
-- a maggio 2027, mix prodotto / processo / brand come da indicazioni cliente.
-- image_url è un placeholder (placehold.co) da sostituire con l'asset reale
-- prima della pubblicazione; la direzione creativa è in internal_note.

insert into editorial_plan_items
  (page_id, scheduled_date, status, social, theme, format, caption, image_url, internal_note)
select id, v.scheduled_date, v.status, v.social, v.theme, v.format, v.caption, v.image_url, v.internal_note
from pages, (
  values
  (
    date '2026-12-01', 'da_fare', array['Instagram'],
    'Form is Function — il nostro manifesto',
    'Statica (grafica tipografica)',
    E'Non vestiamo semplicemente le macchine. Diamo loro identità, efficienza e sicurezza.\n\nProgettiamo carenature e protezioni industriali che uniscono forma e funzione: per noi il design non è un rivestimento, è ingegneria.\n\nForm is Function. Function is Form.\n\n👉 Scopri il nostro approccio su formest.it (link in bio).\n\n#Formest #FormIsFunction #CarenatureIndustriali #DesignIndustriale #IndustrialDesign #MadeInItaly #Ingegneria #WeBuildIndustrialSafety #ManufacturingExcellence',
    'https://placehold.co/1080x1080/0f1c3f/ffffff?text=Post+1+-+Form+is+Function',
    'Grafica statica 1080x1080, sfondo blu notte/nero, tipografia bold bianca stile "form is function / function is form" (vedi contenuto storico simile in archivio). Nessuna foto/persona, solo tipografia coerente con la palette brand.'
  ),
  (
    date '2026-12-15', 'da_fare', array['Instagram'],
    'Dietro ogni macchina, una carenatura su misura',
    'Carosello (render + foto reale)',
    E'Ogni macchina utensile ha esigenze uniche di ingombro, accessibilità e sicurezza operatore. Le nostre carenature nascono da un progetto meccanico dedicato, non da un catalogo standard.\n\nScorri per vedere il render 3D e il risultato finale montato in produzione. ⚙️\n\nHai un progetto di carenatura per macchine utensili? Parliamone.\n\n#Formest #MacchineUtensili #CarenatureIndustriali #ConceptDesign #ProgettazioneMeccanica #IndustrialDesign #FormIsFunction #Automazione #B2BManufacturing',
    'https://placehold.co/1080x1080/e5e5e5/1a1a1a?text=Post+2+-+Carenatura+CNC',
    'Carosello 3 slide: 1) render 3D/CAD della carenatura, 2) render fotorealistico colorato, 3) foto della macchina reale montata in reparto. Sfondo bianco/grigio, stesso stile dei render prodotto già pubblicati.'
  ),
  (
    date '2026-12-29', 'da_fare', array['Instagram'],
    'Un anno di progetti, un anno di fiducia',
    'Statica (tipografia corsivo)',
    E'Il 2026 per noi è stato fatto di carenature disegnate, saldature certificate, notti in officina e clienti che si sono fidati del nostro modo di lavorare.\n\nFieri dei nostri progetti. Orgogliosi dei nostri clienti.\n\nGrazie a chi ha costruito insieme a noi quest''anno — vi aspettiamo nel 2027 con nuovi progetti. 🎉\n\n#Formest #FormIsFunction #MadeInItaly #Carpenteria #DesignIndustriale #TeamFormest #IndustrialDesign',
    'https://placehold.co/1080x1080/0a1435/d4c9a8?text=Post+3+-+Bilancio+2026',
    'Grafica statica sfondo blu scuro, testo in corsivo elegante bianco/oro, stesso stile del contenuto "Fieri dei nostri progetti, orgogliosi dei nostri clienti" già in archivio. Nessuna foto prodotto, solo tipografia.'
  ),
  (
    date '2027-01-12', 'da_fare', array['Instagram'],
    'La sicurezza nasce in officina',
    'Reel (10-15s)',
    E'Dietro ogni carenatura certificata c''è un processo di saldatura controllato, passo dopo passo. Non è solo lamiera piegata: è controllo qualità in ogni giunto.\n\nLa sicurezza dei vostri operatori comincia qui, nella nostra officina di Padova. 🔧🔥\n\n#Formest #Saldatura #Carpenteria #ControlloQualita #WeBuildIndustrialSafety #MadeInItaly #IndustrialManufacturing #FormIsFunction',
    'https://placehold.co/1080x1920/111111/ffffff?text=Post+4+-+Saldatura',
    'Reel verticale 9:16, riprese ravvicinate delle scintille di saldatura e delle mani dell''operatore con maschera (stile foto già presenti in feed). Musica strumentale/industrial in sottofondo, no parlato necessario, logo Formest in chiusura.'
  ),
  (
    date '2027-01-26', 'da_fare', array['Instagram'],
    'Anche l''automazione ha bisogno di una carenatura intelligente',
    'Singola immagine',
    E'AGV, robot collaborativi, linee automatizzate: la protezione di questi sistemi richiede lo stesso rigore ingegneristico delle macchine utensili tradizionali, ma con vincoli diversi — sensori, cablaggi, accessibilità per la manutenzione.\n\nProgettiamo carenature pensate per l''automazione del futuro.\n\n#Formest #Automazione #AGV #Robotica #IndustrialDesign #CarenatureIndustriali #Industry40 #FormIsFunction',
    'https://placehold.co/1080x1080/f2f2f2/1a1a1a?text=Post+5+-+AGV',
    'Foto still del robot/AGV con contenitori (materiale già in archivio), sfondo bianco neutro, luce da studio. Preferire foto reale del prodotto finito rispetto al render, se disponibile.'
  ),
  (
    date '2027-02-09', 'da_fare', array['Instagram'],
    '3 errori da evitare nella scelta dei materiali per carenature industriali',
    'Carosello educational',
    E'Scegliere il materiale giusto per una carenatura non è solo una questione estetica: incide su peso, isolamento acustico, resistenza e costi di manutenzione.\n\nEcco 3 errori che vediamo più spesso — e come evitarli. Scorri ➡️\n\nVuoi una consulenza sul tuo progetto? Scrivici.\n\n#Formest #ProgettazioneMeccanica #CarenatureIndustriali #DesignIndustriale #IndustrialDesign #MadeInItaly',
    'https://placehold.co/1080x1080/3a5faa/ffffff?text=Post+6+-+3+Errori+Materiali',
    'Carosello 4 slide, stesso template grafico del contenuto "3 Tips per evitare errori nella progettazione delle carenature" (copertina azzurra con titolo, poi 3 slide una per errore). Contenuto tecnico da far validare all''ufficio tecnico Formest prima della pubblicazione.'
  ),
  (
    date '2027-02-23', 'da_fare', array['Instagram'],
    'Precisione al millimetro, dal taglio al montaggio',
    'Reel',
    E'Ogni componente della carenatura parte da un taglio laser di precisione. È il primo passo di un processo che dalla lamiera grezza arriva al pezzo finito, pronto per saldatura e verniciatura.\n\nLa qualità si costruisce a ogni fase. ✨\n\n#Formest #TaglioLaser #Carpenteria #Precisione #MadeInItaly #ProduzioneIndustriale #FormIsFunction',
    'https://placehold.co/1080x1920/000000/ffcc00?text=Post+7+-+Taglio+Laser',
    'Reel verticale 9:16, riprese ravvicinate del taglio laser/plasma con scintille (stile foto archivio), rallenty se possibile. No testo in overlay eccetto logo finale.'
  ),
  (
    date '2027-03-09', 'da_fare', array['Instagram'],
    'Meno rumore, più sicurezza: le nostre cabine insonorizzate',
    'Carosello',
    E'Le cabine di protezione non servono solo a contenere una macchina: riducono il rumore, isolano le vibrazioni e proteggono l''operatore, mantenendo accessibilità e visibilità per la manutenzione.\n\nUn esempio di cabina insonorizzata progettata e realizzata da noi. 🔇\n\n#Formest #CabineInsonorizzate #SicurezzaSulLavoro #IndustrialDesign #ProgettazioneMeccanica #FormIsFunction #MadeInItaly',
    'https://placehold.co/1080x1080/e5e5e5/1a1a1a?text=Post+8+-+Cabina+Insonorizzata',
    'Carosello 2-3 slide: foto d''insieme della cabina (bianca con finestre e portello, materiale già in archivio), dettaglio delle finestre/isolamento, eventuale foto in esercizio presso reparto cliente (solo se autorizzata).'
  ),
  (
    date '2027-03-23', 'da_fare', array['Instagram'],
    'Il nostro metodo: da concept a produzione',
    'Infografica (carosello)',
    E'Concept Design, Progettazione Ingegneristica, Pianificazione della Produzione, Controllo Qualità: 4 fasi, un solo obiettivo — trasformare le esigenze tecniche e di brand in un progetto coerente e funzionante.\n\nEcco come lavoriamo, progetto dopo progetto.\n\n#Formest #ConceptDesign #ProgettazioneMeccanica #ProduzioneIndustriale #ControlloQualita #FormIsFunction #IndustrialDesign #MadeInItaly',
    'https://placehold.co/1080x1080/3a5faa/ffffff?text=Post+9+-+Il+Nostro+Metodo',
    'Riadattare in italiano l''infografica "Concept Design / Engineering Design / Production Planning / Production and quality control" già esistente in archivio (grafico a spirale blu), mantenendo lo stesso stile grafico e font Formest.'
  ),
  (
    date '2027-04-06', 'da_fare', array['Instagram'],
    'Materiali che fanno la differenza',
    'Singola immagine (macro)',
    E'Non tutte le carenature sono lamiera. Quando servono leggerezza e resistenza — componenti mobili o parti ad alte prestazioni — valutiamo materiali compositi come la fibra di carbonio.\n\nIl materiale giusto è parte del progetto fin dal primo schizzo.\n\n#Formest #FibraDiCarbonio #MaterialiCompositi #IndustrialDesign #Ingegneria #Innovazione #FormIsFunction',
    'https://placehold.co/1080x1080/000000/cccccc?text=Post+10+-+Fibra+di+Carbonio',
    'Foto macro dei pannelli in fibra di carbonio (dettaglio texture, materiale già in archivio), sfondo scuro/nero per far risaltare la trama del materiale, illuminazione laterale.'
  ),
  (
    date '2027-04-20', 'da_fare', array['Instagram'],
    'Chi c''è dietro ai progetti Formest',
    'Video/intervista breve',
    E'Dietro ogni carenatura che vedete online c''è un team di progettisti, ingegneri e carpentieri che lavora ogni giorno per unire estetica, funzione e sicurezza.\n\nIn questo video, uno sguardo alla nostra visione di progetto. 🎥\n\n#Formest #TeamFormest #Vision #IndustrialDesign #MadeInItaly #FormIsFunction #Ingegneria',
    'https://placehold.co/1080x1920/222222/ffffff?text=Post+11+-+Team+%26+Vision',
    'Video verticale 9:16, intervista breve (stile già girato, persona in camicia bianca che parla in reparto), 30-45 secondi. Sottotitoli in italiano obbligatori (audio spesso muto su Instagram).'
  ),
  (
    date '2027-05-04', 'da_fare', array['Instagram'],
    'Il design Formest riconosciuto a livello nazionale',
    'Statica/carosello',
    E'Essere selezionati nell''ADI Design Index significa vedere riconosciuto un modo di progettare che mette insieme funzione, forma e innovazione — gli stessi principi che applichiamo ogni giorno ai progetti dei nostri clienti.\n\nUn traguardo che condividiamo con chi lavora con noi ogni giorno. 🏆\n\n#Formest #ADIDesignIndex #CompassoDoro #IndustrialDesign #DesignItaliano #FormIsFunction #MadeInItaly',
    'https://placehold.co/1080x1080/000000/ffffff?text=Post+12+-+ADI+Design+Index',
    'Grafica statica su sfondo nero con logo ADI Design Index + prodotto premiato (render già in archivio), stile minimal coerente con il contenuto esistente "ADI DESIGN INDEX / Selezione Compasso d''Oro".'
  )
) as v(scheduled_date, status, social, theme, format, caption, image_url, internal_note)
where pages.name = 'Formest';
