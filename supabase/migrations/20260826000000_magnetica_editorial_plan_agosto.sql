-- Backfill dei 4 post di agosto 2026 per Magnetica Design (già pubblicati,
-- presi dallo storico condiviso dal cliente), cosi il Piano Editoriale
-- mostra lo storico completo e non solo i contenuti di settembre in poi.

insert into editorial_plan_items
  (page_id, scheduled_date, status, social, theme, format, caption, image_url, internal_note)
select id, v.scheduled_date, v.status, v.social, v.theme, v.format, v.caption, v.image_url, v.internal_note
from pages, (
  values
  (
    date '2026-08-04', 'pubblicato', array['Instagram', 'Pinterest'],
    'Prodotto',
    'Carosello',
    E'L''ordine come forma d''arte.\nONGAKU è il porta cuffie pensato per dare al tuo setup un posto preciso, pulito e coerente con il tuo stile.\n\n#magneticadesign #ongaku #portacuffie #desksetup #madeinitaly',
    'https://drive.google.com/drive/folders/1XsqxEzEM_hZPq3LCYAlRH4H_nWwQAGXF?usp=share_link',
    'Titolo/argomento: Porta cuffie. Struttura: Scrivania in uso / scrivania ordinata.'
  ),
  (
    date '2026-08-11', 'pubblicato', array['Instagram'],
    'Upcycling',
    'Carosello (3 slide)',
    E'Uno sfrido. Due settimane dopo.\n\nScorti per la trasformazione.\n\n#magneticadesign #primaedopo #upcycling',
    'https://drive.google.com/drive/folders/1vu6ZcloTL7Q606Ml-Hk1ZgzqdOD3HEJX?usp=share_link',
    'Titolo/argomento: Prima e dopo: la lamiera che diventa design. Struttura: Slide 1: sfrido grezzo / Slide 2: lavorazione / Slide 3: prodotto finito.'
  ),
  (
    date '2026-08-18', 'pubblicato', array['Instagram', 'Pinterest'],
    'Persone e Idee',
    'Singola Immagine',
    E'Badge e chiavi sparsi.\nUn posto per ogni persona del team.\nL''ufficio, finalmente in ordine.\n\n#magneticadesign #designfunzionale #organizzazioneufficio #madeinitaly',
    'https://drive.google.com/drive/folders/1pTNrcm2bsiSOXfSUMSxC_FZttSFAxeC2?usp=share_link',
    'Titolo/argomento: Porta chiavi personalizzato per ordinare l''ingresso di un ufficio.'
  ),
  (
    date '2026-08-25', 'pubblicato', array['Instagram'],
    'Valori',
    'Post singolo',
    E'L''acciaio al carbonio non è solo un materiale. È una filosofia: resistente, durevole, riciclabile all''infinito.\n\n#magneticadesign #acciaio #sostenibilità',
    'https://drive.google.com/drive/folders/1vASD5m-tGM1DRWUuv_fKIRayUUWHO18e?usp=share_link',
    'Titolo/argomento: ↑ Acciaio: il materiale che viviamo ogni giorno. Struttura: Foto dettaglio texture acciaio. Testo 3 qualità: resistente, durevole, riciclabile.'
  )
) as v(scheduled_date, status, social, theme, format, caption, image_url, internal_note)
where pages.name = 'Magnetica Design';
