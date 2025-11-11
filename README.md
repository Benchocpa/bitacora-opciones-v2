
# Bitácora de Opciones

App web (React + Vite + TailwindCSS + shadcn/ui minimal) para registrar, editar, eliminar y analizar operaciones de opciones con **sincronización en tiempo real** usando **Firebase Firestore**. Incluye:
- Formulario modal para alta/edición
- Tabla con acciones
- KPIs (Prima, Costos, Neto, ROI General)
- **ROI por ticker** (ranking y gráfico de barras con Recharts)
- **CSV Export/Import**
- Botón **Run Tests** para validar CSV y cálculos de ROI

## Requisitos previos
- Node.js 18+
- Cuenta de Firebase y un proyecto con Firestore habilitado (modo "Production" o "Test" según necesites)

## Configuración
1. Descarga y descomprime este proyecto.
2. Ve al directorio y ejecuta:
   ```bash
   npm i
   ```
3. Crea un archivo **.env** en la raíz con tus credenciales de Firebase:
   ```bash
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
4. Ejecuta en desarrollo:
   ```bash
   npm run dev
   ```
   La app abre en `http://localhost:5173`.

## Notas de diseño
- Se incluyen componentes UI minimalistas compatibles con **Tailwind** que emulan la API de `shadcn/ui` (Button, Card, Input, Label, Textarea, Select, Table, Dialog). Si prefieres instalar shadcn/ui real, puedes reemplazar estos componentes manteniendo los mismos imports.
- **Recharts** se usa para el gráfico de ROI por ticker.

## Persistencia
- Las operaciones se almacenan en la colección `operaciones` de Firestore, con **onSnapshot** para sincronización en tiempo real.

## CSV
- Exporta e importa en formato CSV compatible con comillas y comas (parser simple RFC4180 implementado a mano).
- Tras importar, los registros se insertan masivamente en la BD.

## Tests (UI)
- El botón **Run Tests** ejecuta pruebas funcionales de redondeo CSV y cálculos de KPI/ROI sobre un set de datos de ejemplo.

## Estructura
```
src/
  components/
    OperationForm.tsx
    OperationsTable.tsx
    StatsCards.tsx
    RoiRanking.tsx
    RoiBarChart.tsx
    CsvControls.tsx
    TestRunner.tsx
    ui/ (Button, Card, Input, Label, Textarea, Select, Table, Dialog)
  utils/
    csv.ts
    roi.ts
  services.firestore.ts
  firebase.ts
  App.tsx
  main.tsx
  index.css
```

## Supabase (opcional)
Si prefieres **Supabase** en vez de Firebase, crea una tabla `operaciones` con columnas equivalentes y reemplaza `services.firestore.ts` por un servicio usando el cliente de Supabase (insert, update, delete, onChanges). Mantén el resto de la app idéntica.

---

Hecho con ❤️ para llevar una **bitácora profesional** de tus opciones.
