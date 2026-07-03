# Lagerverwaltung (Go-Version)

Lokale Lagerverwaltung mit **Go** und **SQLite**. Der Server wird zu einem einzigen
ausführbaren Programm (Binary) kompiliert. Die Oberfläche läuft im Browser,
die Daten werden direkt in eine SQLite-Datei (`lager.sqlite`) im Programmordner
gespeichert. Es wird keine Internet-Verbindung benötigt.

Verwendet [`modernc.org/sqlite`](https://pkg.go.dev/modernc.org/sqlite) (SQLite),
[`go-pdf/fpdf`](https://pkg.go.dev/github.com/go-pdf/fpdf) (PDF-Rechnungen) und
[`skip2/go-qrcode`](https://pkg.go.dev/github.com/skip2/go-qrcode) (QR-Codes) –
alles **reines Go**. Dadurch ist **kein C-Compiler (cgo)** nötig, und es gibt –
anders als bei `better-sqlite3` in der Node.js-Version – **kein lästiges
Kompilieren nativer Module** auf dem Raspberry Pi.

## Inhalt

- [Funktionen](#funktionen)
- [Voraussetzungen](#voraussetzungen)
- [Go installieren](#go-installieren)
- [Bauen (kompilieren)](#bauen-kompilieren)
- [Starten](#starten)
- [Auf Raspberry Pi einsetzen](#auf-raspberry-pi-einsetzen)
- [Autostart mit systemd](#autostart-mit-systemd)
- [Backup & Wiederherstellung](#backup--wiederherstellung)
- [Daten aus der Node.js-Version übernehmen](#daten-aus-der-nodejs-version-übernehmen)
- [Projektstruktur](#projektstruktur)
- [Fehlerbehebung](#fehlerbehebung)

### Lager

- Artikel anlegen / bearbeiten / löschen
- Teile **einbuchen** und **abbuchen** (Abbuchen nie mehr als auf Lager)
- Felder: Bezeichnung, Artikelnummer/SKU, Kategorie, Lagerort, Menge,
  Mindestbestand, **Einkaufspreis (EK)**, **Verkaufspreis (VK)**, Bemerkung
- Spalte **Blockiert/Verfügbar**: in offenen Verkäufen reservierte Menge wird
  vom verfügbaren Bestand abgezogen
- **Mehrere Bilder pro Artikel** (Upload, Großansicht mit Blättern, Miniatur in
  der Liste). Bilder werden im Browser verkleinert und in der SQLite-Datenbank
  gespeichert (kein zusätzlicher Ordner).
- **Statusanzeige**: 🟢 OK, 🔴 Mangel (Menge ≤ Mindestbestand), 🔴 Leer (Menge 0)
- **Bewegungs-Historie** pro Artikel (jede Ein-/Ausbuchung mit Datum + Notiz)
- **QR-Code pro Artikel** (Inhalt = Bezeichnung + Artikel-Nr.): über das Symbol ▦
  anzeigen und mit Beschriftung **ausdrucken** (z. B. als Etikett am Lagerort)
- Suche, Kategorie-Filter, sortierbare Spalten
- Übersicht: Artikelzahl, Teile gesamt, Lagerwert, Mangelbestand
- CSV-Export (z. B. für Excel)

### Verkäufe & Adressen

- **Adressverwaltung** für Kunden und eigene Verkäufer-Adressen; ein Verkäufer
  kann als Standard-Absender markiert werden
- **Logo pro Verkäufer-Adresse**: ein Logo hochladen, das auf der Rechnung
  erscheint (Logo + Verkäufer-Adresse links, Käufer-Adresse rechts)
- **Verkäufe** als Entwurf erfassen (mit Positionen aus dem Lager oder frei),
  bei Bedarf zwischenspeichern und später abschließen
- **Reservierung**: Mengen in offenen Verkäufen blockieren den Bestand, damit er
  nicht doppelt verkauft wird
- Beim **Abschluss** wird der Bestand geprüft und abgebucht, eine fortlaufende
  Rechnungsnummer (`V-JAHR-0001`) vergeben und eine **PDF-Rechnung** erzeugt
- PDF im Browser ansehen oder herunterladen; Adress-Stand wird im Verkauf
  „eingefroren" (Snapshot), damit spätere Adressänderungen alte Rechnungen nicht
  verändern

## Starten

```bash
./lagerverwaltung
```

Danach im Browser öffnen: **http://localhost:3000**

Die Datenbank-Datei `lager.sqlite` wird beim ersten Start automatisch im
Programmordner angelegt. Anderer Port:

```bash
PORT=8080 ./lagerverwaltung
```

## Auf Raspberry Pi einsetzen

`lagerverwaltung-pi4` zusammen mit dem Ordner `public/` auf den Pi kopieren.
Weil `modernc.org/sqlite` reines Go ist, funktioniert das Cross-Kompilieren ohne
zusätzliche C-Cross-Toolchain.

## Autostart mit systemd

Die Vorlage `lagerverwaltung.service` liegt bei. Darin ggf. anpassen:

- `User=` – Benutzer, unter dem der Dienst läuft
- `WorkingDirectory=` – Programmordner (muss `public/` enthalten)
- `ExecStart=` – Pfad zum Binary
- `Environment=PORT=80` – Port (80 = Zugriff ohne `:3000`)

```bash
sudo cp lagerverwaltung.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable lagerverwaltung
sudo systemctl start lagerverwaltung
sudo systemctl status lagerverwaltung
```

Nützlich:

```bash
sudo systemctl restart lagerverwaltung   # neu starten (nach Update)
journalctl -u lagerverwaltung -f         # Live-Logs
```

## Backup & Wiederherstellung

Alle Daten stecken in der Datei **`lager.sqlite`**.

- **Backup:** Datei kopieren (am besten bei gestopptem Dienst):
  ```bash
  cp lager.sqlite lager-backup-$(date +%F).sqlite
  ```
- **Wiederherstellen:** Backup zurück nach `lager.sqlite` kopieren, Dienst neu starten.

## Daten aus der Node.js-Version übernehmen

Das Datenbankformat ist identisch. Einfach die Datei `lager.sqlite` (sowie ggf.
`lager.sqlite-shm` / `lager.sqlite-wal`) aus dem Node.js-Ordner in den
Projektordner `lagerverwaltung/` kopieren – fertig.

## Projektstruktur

```
lagerverwaltung/
├── public/                       # Browser-Oberfläche
│   ├── index.html                #   Lager
│   ├── verkauf.html              #   Neuer Verkauf
│   ├── verkaeufe.html            #   Verkaufsübersicht
│   ├── adressen.html             #   Adressen
│   ├── app.js                    #   gemeinsame Helfer (API, Navigation)
│   └── style.css                 #   Styling
├── lagerverwaltung               # vorkompiliertes Binary für PC (Linux/amd64)
├── lagerverwaltung-pi4           # vorkompiliertes Binary für Raspberry Pi (Linux/arm64)
├── lagerverwaltung.service       # systemd-Vorlage für Autostart
├── lager.sqlite                  # Datenbank (wird automatisch erzeugt, nicht im Repo)
└── README.md
```

> Die mitgelieferten Binaries (`lagerverwaltung`, `lagerverwaltung-pi4`)
> sind bereits fertig kompiliert – zum reinen Betrieb wird **kein Go** benötigt.
> Wichtig ist nur, dass der Ordner `public/` daneben liegt. Neu bauen lässt sich

## Fehlerbehebung

### Port 3000/80 belegt

Anderen Port verwenden: `PORT=8080 ./lagerverwaltung`. Bei Port 80 prüfen, ob
ein anderer Webserver läuft: `sudo ss -tlnp | grep ':80'`.

## Probleme und Erweiterungen einfach Melden
