import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "./supabaseClient"
import { getStockPrice, getStockName } from "./services/priceService"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts"
import Historial from "./components/Historial"
import {
  cargarHistorial,
  registrarEventoHistorial,
} from "./services/historialService"

// ======================
// Tipos
// ======================

type Operacion = {
  id: number
  fechaInicio: string
  fechaVencimiento: string | null
  fechaCierre: string | null
  ticker: string
  estrategia: string
  acciones: number
  strike: number
  primaRecibida: number
  primaTotal?: number
  comision: number
  costoCierre: number
  capitalInv: number
  neto: number
  roi: number
  estado: string
  nota?: string | null
}

type FormState = {
  fechaInicio: string
  fechaVencimiento: string
  fechaCierre: string
  ticker: string
  estrategia: string
  acciones: string
  strike: string
  primaRecibida: string
  comision: string
  costoCierre: string
  estado: string
  nota: string
}

type TickerStats = {
  ticker: string
  operaciones: number
  prima: number
  costos: number
  neto: number
  capitalInv: number
  breakEven: number
  roi: number
  accionesTotales: number
}

// ======================
// Estado inicial del formulario
// ======================

const emptyForm: FormState = {
  fechaInicio: "",
  fechaVencimiento: "",
  fechaCierre: "",
  ticker: "",
  estrategia: "",
  acciones: "",
  strike: "",
  primaRecibida: "",
  comision: "",
  costoCierre: "",
  estado: "Abierta",
  nota: "",
}

// ======================
// Componente principal
// ======================

function App() {
  const [operaciones, setOperaciones] = useState<Operacion[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPage, setLoadingPage] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isChartOpen, setIsChartOpen] = useState(false)
  const [precios, setPrecios] = useState<Record<string, number | null>>({})
  const [preciosCargados, setPreciosCargados] = useState(false)
  const [nombres, setNombres] = useState<Record<string, string | null>>({})
  const [tickerName, setTickerName] = useState<string | null>(null)
  const [tickerNameLoading, setTickerNameLoading] = useState(false)
  const [tickerNameError, setTickerNameError] = useState<string | null>(null)



  // Historial
  const [historial, setHistorial] = useState<any[]>([])

  // Modal de ROLADO
  const [isRollOpen, setIsRollOpen] = useState(false)
  const [rollBase, setRollBase] = useState<Operacion | null>(null)
  const [rollForm, setRollForm] = useState({
    fechaInicio: "",
    fechaVencimiento: "",
    strike: "",
    primaRecibida: "",
    comision: "",
    costoCierre: "",
  })

  // Modal de CIERRE RÁPIDO
  const [isCloseOpen, setIsCloseOpen] = useState(false)
  const [closeOp, setCloseOp] = useState<Operacion | null>(null)
  const [closeForm, setCloseForm] = useState<{
    fechaCierre: string
    comision: string
    costoCierre: string
  }>({
    fechaCierre: "",
    comision: "",
    costoCierre: "",
  })

  // ======================
  // Cargar operaciones desde Supabase
  // ======================

  async function cargarOperaciones() {
    setLoadingPage(true)
    setErrorMsg(null)

    const { data, error } = await supabase
      .from("operaciones")
      .select("*")
      .order("id", { ascending: false })

    if (error) {
      console.error("Error cargando operaciones:", error)
      setErrorMsg("No se pudieron cargar las operaciones")
      setLoadingPage(false)
      return
    }

    const parsed: Operacion[] =
      data?.map((row: any): Operacion => {
        const acciones = Number(row.acciones ?? 0)
        const strike = Number(row.strike ?? 0)

        const primaRecibida = Number(
          row.prima_recibida ?? row.primaRecibida ?? 0,
        )

        const primaTotal = Number(
          row.prima_total ??
            row.primaTotal ??
            row.prima_recibida ??
            row.primaRecibida ??
            0,
        )

        const comision = Number(row.comision ?? 0)
        const costoCierre = Number(row.costo_cierre ?? row.costoCierre ?? 0)

        const capitalInv = acciones * strike

        // Neto para la tabla = solo la última prima
        const neto = primaRecibida - comision - costoCierre

        const roi = capitalInv > 0 ? (neto / capitalInv) * 100 : 0

        return {
          id: row.id,
          fechaInicio:
            row.fecha_inicio ?? row.fechaInicio ?? row.fechainicio ?? "",
          fechaVencimiento:
            row.fecha_vencimiento ??
            row.fechaVencimiento ??
            row.fechavencimiento ??
            null,
          fechaCierre:
            row.fecha_cierre ?? row.fechaCierre ?? row.fechacierre ?? null,
          ticker: (row.ticker ?? "").toUpperCase(),
          estrategia: row.estrategia ?? row.estretegia ?? "",
          acciones,
          strike,
          primaRecibida,
          primaTotal,
          comision,
          costoCierre,
          capitalInv,
          neto,
          roi,
          estado: row.estado ?? "Abierta",
          nota: row.nota ?? "",
        }
      }) ?? []

    setOperaciones(parsed)
    setLoadingPage(false)
  }

  async function cargarHistorialState() {
    try {
      const data = await cargarHistorial()
      setHistorial(data)
    } catch (e) {
      // ya se hace console.error en el servicio
    }
  }

  useEffect(() => {
    cargarOperaciones()
    cargarHistorialState()
  }, [])

  // ======================
  // Cargar precios
  // ======================

  async function cargarPrecios() {
  const tickers = Array.from(
    new Set(operaciones.map((o) => o.ticker.trim().toUpperCase())),
  )

  const tempPrecios: Record<string, number | null> = {}
  const tempNombres: Record<string, string | null> = {}

  for (const t of tickers) {
    tempPrecios[t] = await getStockPrice(t)
    tempNombres[t] = await getStockName(t)
  }

  setPrecios(tempPrecios)
  setNombres(tempNombres)
}


  useEffect(() => {
    if (operaciones.length > 0 && !preciosCargados) {
      setPreciosCargados(true)
      cargarPrecios()
    }
  }, [operaciones, preciosCargados])

  // ======================
  // Cálculos derivados
  // ======================

  const totalPrima = useMemo(
    () =>
      operaciones.reduce(
        (acc, op) => acc + (op.primaTotal ?? op.primaRecibida ?? 0),
        0,
      ),
    [operaciones],
  )

  const totalCostos = useMemo(
    () =>
      operaciones.reduce(
        (acc, op) => acc + op.comision + op.costoCierre,
        0,
      ),
    [operaciones],
  )

  const totalNeto = useMemo(
    () =>
      operaciones.reduce((acc, op) => {
        const prima = op.primaTotal ?? op.primaRecibida ?? 0
        const costos = op.comision + op.costoCierre
        return acc + (prima - costos)
      }, 0),
    [operaciones],
  )

  const totalCapitalInv = useMemo(
    () => operaciones.reduce((acc, op) => acc + op.capitalInv, 0),
    [operaciones],
  )

  const roiGeneral = useMemo(
    () => (totalCapitalInv > 0 ? (totalNeto / totalCapitalInv) * 100 : 0),
    [totalNeto, totalCapitalInv],
  )

  const roiPorTicker: TickerStats[] = useMemo(() => {
    const mapa = new Map<string, TickerStats>()

    for (const op of operaciones) {
      if (!mapa.has(op.ticker)) {
        mapa.set(op.ticker, {
          ticker: op.ticker,
          operaciones: 0,
          prima: 0,
          costos: 0,
          neto: 0,
          capitalInv: 0,
          breakEven: 0,
          roi: 0,
          accionesTotales: 0,
        })
      }

      const item = mapa.get(op.ticker)!
      const primaOp = op.primaTotal ?? op.primaRecibida ?? 0
      const costosOp = op.comision + op.costoCierre

      item.operaciones += op.acciones / 100 // "ROLLS / contratos"
      item.prima += primaOp
      item.costos += costosOp
      item.neto += primaOp - costosOp
      item.capitalInv += op.capitalInv
      item.accionesTotales += op.acciones
    }

    for (const item of mapa.values()) {
      item.roi =
        item.capitalInv > 0 ? (item.neto / item.capitalInv) * 100 : 0

      const totalAcc = item.accionesTotales
      const primaPorAccion = totalAcc > 0 ? item.prima / totalAcc : 0
      const strikePromedio = totalAcc > 0 ? item.capitalInv / totalAcc : 0

      item.breakEven = strikePromedio - primaPorAccion
    }

    return Array.from(mapa.values())
  }, [operaciones])

  function todayISO() {
    return new Date().toISOString().slice(0, 10)
  }

  // ======================
  // Handlers de formulario
  // ======================

  function openNew() {
    setEditingId(null)
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  function openEdit(op: Operacion) {
    setEditingId(op.id)
    setForm({
      fechaInicio: op.fechaInicio ?? "",
      fechaVencimiento: op.fechaVencimiento ?? "",
      fechaCierre: op.fechaCierre ?? "",
      ticker: op.ticker,
      estrategia: op.estrategia,
      acciones: String(op.acciones || ""),
      strike: String(op.strike || ""),
      primaRecibida: String(op.primaRecibida || ""),
      comision: String(op.comision || ""),
      costoCierre: String(op.costoCierre || ""),
      estado: op.estado ?? "Abierta",
      nota: op.nota ?? "",
    })
    setIsFormOpen(true)
  }

  function closeFormModal() {
    setIsFormOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const prima = Number(form.primaRecibida || 0)

      // calcular prima_total según sea creación o edición
      let primaTotal: number

      if (editingId == null) {
        primaTotal = prima
      } else {
        const opAnterior = operaciones.find((op) => op.id === editingId)

        if (opAnterior) {
          const totalAnterior =
            opAnterior.primaTotal ?? opAnterior.primaRecibida ?? 0
          const ultimaPrimaAnterior = opAnterior.primaRecibida ?? 0

          primaTotal = totalAnterior - ultimaPrimaAnterior + prima
        } else {
          primaTotal = prima
        }
      }

      const payload = {
        fecha_inicio: form.fechaInicio || null,
        fecha_vencimiento: form.fechaVencimiento || null,
        fecha_cierre: form.fechaCierre || null,
        ticker: form.ticker.trim().toUpperCase(),
        estrategia: form.estrategia,
        acciones: Number(form.acciones || 0),
        strike: Number(form.strike || 0),
        prima_recibida: prima,
        prima_total: primaTotal,
        comision: Number(form.comision || 0),
        costo_cierre: Number(form.costoCierre || 0),
        estado: form.estado || "Abierta",
        nota: form.nota || null,
      }

      if (editingId == null) {
        const { error } = await supabase.from("operaciones").insert(payload)
        if (error) throw error

        await registrarEventoHistorial({
          tipo: "Creación",
          ticker: payload.ticker,
          prima,
          comision: payload.comision,
          costoCierre: payload.costo_cierre,
          strike: payload.strike,
          estado: payload.estado,
          nota: payload.nota,
        })
      } else {
        const { error } = await supabase
          .from("operaciones")
          .update(payload)
          .eq("id", editingId)
        if (error) throw error

        await registrarEventoHistorial({
          tipo: "Edición",
          ticker: payload.ticker,
          prima,
          comision: payload.comision,
          costoCierre: payload.costo_cierre,
          strike: payload.strike,
          estado: payload.estado,
          nota: payload.nota,
        })
      }

      await cargarOperaciones()
      await cargarHistorialState()
      closeFormModal()
    } catch (err: any) {
      console.error(err)
      setErrorMsg("No se pudo guardar la operación")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("¿Eliminar esta operación?")) return
    setLoading(true)
    setErrorMsg(null)
    try {
      const opDel = operaciones.find((o) => o.id === id) || null

      const { error } = await supabase
        .from("operaciones")
        .delete()
        .eq("id", id)
      if (error) throw error

      if (opDel) {
        await registrarEventoHistorial({
          tipo: "Eliminación",
          ticker: opDel.ticker,
          prima:
            opDel.primaTotal ?? opDel.primaRecibida ?? 0,
          comision: opDel.comision,
          costoCierre: opDel.costoCierre,
          strike: opDel.strike,
          estado: opDel.estado,
          nota: opDel.nota ?? null,
        })
      }

      await cargarOperaciones()
      await cargarHistorialState()
    } catch (err: any) {
      console.error(err)
      setErrorMsg("No se pudo eliminar la operación")
    } finally {
      setLoading(false)
    }
  }
  async function handleTickerBlur() {
  const symbol = form.ticker.trim().toUpperCase()
  if (!symbol) return

  setTickerNameLoading(true)
  setTickerName(null)
  setTickerNameError(null)

  try {
    const name = await getStockName(symbol)

    if (name) {
      setTickerName(name)
    } else {
      setTickerNameError(
        "No se encontró el nombre o se alcanzó el límite diario del API."
      )
    }
  } catch (err) {
    console.error(err)
    setTickerNameError("Error buscando el nombre del ticker.")
  } finally {
    setTickerNameLoading(false)
  }
}

  // ======================
  // ROLAR OPERACIÓN
  // ======================

  function openRoll(op: Operacion) {
    if (op.estado === "Cerrada" || op.estado === "Expirada") {
      setErrorMsg("No se puede rolar una operación cerrada o expirada.")
      return
    }

    setRollBase(op)
    setRollForm({
      fechaInicio: todayISO(),
      fechaVencimiento: op.fechaVencimiento ?? "",
      strike: op.strike.toString(),
      primaRecibida: "",
      comision: "",
      costoCierre: "",
    })
    setIsRollOpen(true)
  }

  function closeRollModal() {
    setIsRollOpen(false)
    setRollBase(null)
  }

  async function handleRollSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rollBase) return

    setLoading(true)
    setErrorMsg(null)

    try {
      const primaNueva = Number(rollForm.primaRecibida || 0)

      const primaTotalAnterior = Number(
        rollBase.primaTotal ?? rollBase.primaRecibida ?? 0,
      )

      const primaTotalActualizada = primaTotalAnterior + primaNueva

      const payload = {
        fecha_inicio: rollForm.fechaInicio || null,
        fecha_vencimiento: rollForm.fechaVencimiento || null,
        fecha_cierre: rollForm.fechaInicio || null,
        ticker: rollBase.ticker,
        estrategia: rollBase.estrategia,
        acciones: rollBase.acciones,
        strike: Number(rollForm.strike || 0),
        prima_recibida: primaNueva,
        prima_total: primaTotalActualizada,
        comision: Number(rollForm.comision || 0),
        costo_cierre: Number(rollForm.costoCierre || 0),
        estado: "Roleada",
        nota: rollBase.nota ?? null,
      }

      const { error: updateError } = await supabase
        .from("operaciones")
        .update(payload)
        .eq("id", rollBase.id)

      if (updateError) throw updateError

      await registrarEventoHistorial({
        tipo: "Rolado",
        ticker: payload.ticker,
        prima: primaNueva,
        comision: payload.comision,
        costoCierre: payload.costo_cierre,
        strike: payload.strike,
        estado: payload.estado,
        nota: payload.nota ?? null,
      })

      await cargarOperaciones()
      await cargarHistorialState()
      closeRollModal()
    } catch (err: any) {
      console.error(err)
      setErrorMsg("No se pudo rolar la operación")
    } finally {
      setLoading(false)
    }
  }

  // ======================
  // CERRAR OPERACIÓN
  // ======================

  function openCloseModal(op: Operacion) {
    setCloseOp(op)
    setCloseForm({
      fechaCierre: todayISO(),
      comision: op.comision.toString(),
      costoCierre: op.costoCierre.toString(),
    })
    setIsCloseOpen(true)
  }

  function closeCloseModal() {
    setIsCloseOpen(false)
    setCloseOp(null)
  }

  async function handleCloseSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!closeOp) return

    setLoading(true)
    setErrorMsg(null)

    try {
      const comision = Number(closeForm.comision || 0)
      const costoCierre = Number(closeForm.costoCierre || 0)

      const { error } = await supabase
        .from("operaciones")
        .update({
          fecha_cierre: closeForm.fechaCierre || null,
          comision,
          costo_cierre: costoCierre,
          estado: "Cerrada",
        })
        .eq("id", closeOp.id)

      if (error) throw error

      await registrarEventoHistorial({
        tipo: "Cierre",
        ticker: closeOp.ticker,
        prima:
          closeOp.primaTotal ?? closeOp.primaRecibida ?? 0,
        comision,
        costoCierre,
        strike: closeOp.strike,
        estado: "Cerrada",
        nota: closeOp.nota ?? null,
      })

      await cargarOperaciones()
      await cargarHistorialState()
      closeCloseModal()
    } catch (err: any) {
      console.error(err)
      setErrorMsg("No se pudo cerrar la operación")
    } finally {
      setLoading(false)
    }
  }

  // ======================
  // Render
  // ======================

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold">Bitácora de Opciones V2</h1>
          <button
            onClick={openNew}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Nueva operación
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {errorMsg && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* KPIs */}
        <section className="mb-6 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card title="Prima" value={totalPrima} />
          <Card title="Costos" value={totalCostos} />
          <Card title="Neto" value={totalNeto} />
          <Card title="ROI General" value={roiGeneral} isPercentage />
          <Card title="Operaciones" value={operaciones.length} />
          <Card title="Capital Inv." value={totalCapitalInv} />
        </section>

        {/* ROI por ticker */}
        <section className="mb-6 rounded-xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">ROI por ticker</h2>
            {roiPorTicker.length > 0 && (
              <button
                onClick={() => setIsChartOpen(true)}
                className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-100"
              >
                Ver gráfica
              </button>
            )}
          </div>

          {roiPorTicker.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no hay datos suficientes para calcular ROI por ticker.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <th className="px-2 py-2">Ticker</th>
                    <th className="px-2 py-2 text-right">Precio</th>
                    <th className="px-2 py-2 text-right">Rolls</th>
                    <th className="px-2 py-2 text-right">Prima</th>
                    <th className="px-2 py-2 text-right">Costos</th>
                    <th className="px-2 py-2 text-right">Neto</th>
                    <th className="px-2 py-2 text-right">Capital Inv.</th>
                    <th className="px-2 py-2 text-right">Break-even</th>
                    <th className="px-2 py-2 text-right">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {roiPorTicker.map((item) => (
                    <tr
                      key={item.ticker}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td
                        className="px-2 py-2 font-medium"
                        title={nombres[item.ticker] ?? ""}
                      >
                        <div className="flex flex-col">
                          <span>{item.ticker}</span>
                          {nombres[item.ticker] && (
                            <span className="text-[11px] text-slate-500">
                              {nombres[item.ticker]}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-2 py-2 text-right">
                        {precios[item.ticker] != null
                          ? precios[item.ticker]!.toFixed(2)
                          : "–"}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {item.operaciones.toFixed(1)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {item.prima.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {item.costos.toFixed(2)}
                      </td>
                      <td
                        className={`
                          px-2 py-2 text-right
                          ${
                            item.neto > 0
                              ? "text-emerald-600"
                              : item.neto < 0
                              ? "text-red-600"
                              : "text-slate-600"
                          }
                        `}
                      >
                        {item.neto.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {item.capitalInv.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {item.breakEven.toFixed(2)}
                      </td>
                      <td
                        className={`
                          px-2 py-2 text-right font-medium
                          ${
                            item.roi > 0
                              ? "text-emerald-600"
                              : item.roi < 0
                              ? "text-red-600"
                              : "text-slate-600"
                          }
                        `}
                      >
                        {item.roi.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Operaciones registradas */}
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">
            Operaciones registradas
          </h2>

          {loadingPage ? (
            <p className="text-sm text-slate-500">Cargando...</p>
          ) : operaciones.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no has registrado operaciones.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <th className="px-2 py-2">Ticker</th>
                    <th className="px-2 py-2">Estrategia</th>
                    <th className="px-2 py-2">F. inicio</th>
                    <th className="px-2 py-2">F. venc.</th>
                    <th className="px-2 py-2">F. cierre</th>
                    <th className="px-2 py-2 text-right">Acciones</th>
                    <th className="px-2 py-2 text-right">Strike</th>
                    <th className="px-2 py-2 text-right">Prima</th>
                    <th className="px-2 py-2 text-right">Comisión</th>
                    <th className="px-2 py-2 text-right">Costo cierre</th>
                    <th className="px-2 py-2 text-right">Neto</th>
                    <th className="px-2 py-2">Estado</th>
                    <th className="px-2 py-2">Nota</th>
                    <th className="px-2 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {operaciones.map((op) => {
                    const canRoll =
                      op.estado !== "Cerrada" &&
                      op.estado !== "Expirada"

                    return (
                      <tr
                        key={op.id}
                        className="border-b last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-2 py-2 font-medium">
                          {op.ticker}
                        </td>
                        <td className="px-2 py-2">{op.estrategia}</td>
                        <td className="px-2 py-2">
                          {op.fechaInicio || "—"}
                        </td>
                        <td className="px-2 py-2">
                          {op.fechaVencimiento || "—"}
                        </td>
                        <td className="px-2 py-2">
                          {op.fechaCierre || "—"}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {op.acciones}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {op.strike.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {op.primaRecibida.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {op.comision.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {op.costoCierre.toFixed(2)}
                        </td>
                        <td
                          className={`
                          px-2 py-2 text-right
                          ${
                            op.neto > 0
                              ? "text-emerald-600"
                              : op.neto < 0
                              ? "text-red-600"
                              : "text-slate-600"
                          }
                        `}
                        >
                          {op.neto.toFixed(2)}
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={`
                            rounded-full px-2 py-1 text-xs font-medium
                            ${
                              op.estado === "Abierta"
                                ? "bg-emerald-100 text-emerald-700"
                                : op.estado === "Cerrada"
                                ? "bg-slate-100 text-slate-700"
                                : op.estado === "Roleada"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-slate-100 text-slate-600"
                            }
                          `}
                          >
                            {op.estado}
                          </span>
                        </td>
                        <td
                          className="px-2 py-2 max-w-[220px] truncate"
                          title={op.nota ?? ""}
                        >
                          {op.nota || "—"}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              title="Rolar operación"
                              onClick={() => canRoll && openRoll(op)}
                              className={`rounded-md border px-2 py-1 text-xs ${
                                canRoll
                                  ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                                  : "cursor-not-allowed border-slate-200 text-slate-300"
                              }`}
                              disabled={!canRoll}
                            >
                              R
                            </button>
                            <button
                              title="Cerrar operación"
                              onClick={() => openCloseModal(op)}
                              className="rounded-md border border-emerald-300 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                            >
                              C
                            </button>
                            <button
                              title="Editar operación"
                              onClick={() => openEdit(op)}
                              className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                            >
                              E
                            </button>
                            <button
                              title="Eliminar operación"
                              onClick={() => handleDelete(op.id)}
                              className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              X
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Modal formulario */}
        {isFormOpen && (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-2xl rounded-xl bg-white p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {editingId ? "Editar operación" : "Nueva operación"}
                </h2>
                <button
                  onClick={closeFormModal}
                  className="text-sm text-slate-500 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>

              <form
                className="grid gap-3 md:grid-cols-2"
                onSubmit={handleSubmit}
              >
                {/* Ticker */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">
                  Ticker
                </label>
                <input
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                  value={form.ticker}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase()
                    setForm((f) => ({ ...f, ticker: value }))
                    // cada vez que cambias el ticker, reseteamos el nombre
                    setTickerName(null)
                    setTickerNameError(null)
                  }}
                  onBlur={handleTickerBlur}   // 👈 aquí disparamos la búsqueda del nombre
                  required
                />

                {tickerNameLoading && (
                  <span className="text-[11px] text-slate-500">
                    Buscando nombre del ticker...
                  </span>
                )}

                {tickerName && !tickerNameLoading && (
                  <span className="text-[11px] text-slate-600">
                    {tickerName}
                  </span>
                )}

                {tickerNameError && (
                  <span className="text-[11px] text-red-500">
                    {tickerNameError}
                  </span>
                )}
              </div>


                {/* Estrategia */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Estrategia
                  </label>
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={form.estrategia}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, estrategia: e.target.value }))
                    }
                  >
                    <option value="">Selecciona una estrategia</option>
                    <option value="CSP">CSP (Cash Secured Put)</option>
                    <option value="CC">CC (Covered Call)</option>
                    <option value="BPS">BPS (Bull Put Spread)</option>
                    <option value="BCS">BCS (Bull Call Spread)</option>
                    <option value="IC">IC (Iron Condor)</option>
                    <option value="PCS">PCS (Put Credit Spread)</option>
                    <option value="CCS">CCS (Call Credit Spread)</option>
                    <option value="SC">SC (Short Call)</option>
                    <option value="SP">SP (Short Put)</option>
                  </select>
                </div>

                {/* Fecha inicio */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={form.fechaInicio}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fechaInicio: e.target.value }))
                    }
                  />
                </div>

                {/* Fecha vencimiento */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Fecha vencimiento
                  </label>
                  <input
                    type="date"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={form.fechaVencimiento}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        fechaVencimiento: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Fecha cierre */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Fecha cierre
                  </label>
                  <input
                    type="date"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={form.fechaCierre}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fechaCierre: e.target.value }))
                    }
                  />
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Acciones
                  </label>
                  <input
                    type="number"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={form.acciones}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, acciones: e.target.value }))
                    }
                  />
                </div>

                {/* Strike */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Strike
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={form.strike}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, strike: e.target.value }))
                    }
                  />
                </div>

                {/* Prima recibida */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Prima recibida
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={form.primaRecibida}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        primaRecibida: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Comisión */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Comisión
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={form.comision}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, comision: e.target.value }))
                    }
                  />
                </div>

                {/* Costo cierre */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Costo cierre
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={form.costoCierre}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        costoCierre: e.target.value,
                      }))
                    }
                  />
                </div>

                {/* Estado */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Estado
                  </label>
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={form.estado}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, estado: e.target.value }))
                    }
                  >
                    <option value="Abierta">Abierta</option>
                    <option value="Cerrada">Cerrada</option>
                    <option value="Roleada">Roleada</option>
                    <option value="Expirada">Expirada</option>
                  </select>
                </div>

                {/* Nota */}
                <div className="md:col-span-2 flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Nota
                  </label>
                  <textarea
                    className="min-h-[60px] rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={form.nota}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nota: e.target.value }))
                    }
                    placeholder="Ej: Entré por soporte, rolo si toca el strike anterior..."
                  />
                </div>

                <div className="col-span-2 mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-black px-4 py-1 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading
                      ? "Guardando..."
                      : editingId
                      ? "Guardar cambios"
                      : "Guardar operación"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de ROLADO */}
        {isRollOpen && rollBase && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-xl rounded-xl bg-white p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Rolar operación ({rollBase.ticker})
                </h2>
                <button
                  onClick={closeRollModal}
                  className="text-sm text-slate-500 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>

              <p className="mb-3 text-xs text-slate-500">
                Se actualizará esta operación con las nuevas fechas, strike y
                prima. La prima total acumulada se irá sumando con cada rolado.
              </p>

              <form
                className="grid gap-3 md:grid-cols-2"
                onSubmit={handleRollSubmit}
              >
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Ticker
                  </label>
                  <input
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-sm"
                    value={rollBase.ticker}
                    disabled
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Fecha inicio (nuevo)
                  </label>
                  <input
                    type="date"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={rollForm.fechaInicio}
                    onChange={(e) =>
                      setRollForm((f) => ({
                        ...f,
                        fechaInicio: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Fecha vencimiento (nuevo)
                  </label>
                  <input
                    type="date"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={rollForm.fechaVencimiento}
                    onChange={(e) =>
                      setRollForm((f) => ({
                        ...f,
                        fechaVencimiento: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Strike (nuevo)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={rollForm.strike}
                    onChange={(e) =>
                      setRollForm((f) => ({
                        ...f,
                        strike: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Prima recibida (nuevo)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={rollForm.primaRecibida}
                    onChange={(e) =>
                      setRollForm((f) => ({
                        ...f,
                        primaRecibida: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Comisión (nuevo)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={rollForm.comision}
                    onChange={(e) =>
                      setRollForm((f) => ({
                        ...f,
                        comision: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Costo cierre inmediato (si aplica)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={rollForm.costoCierre}
                    onChange={(e) =>
                      setRollForm((f) => ({
                        ...f,
                        costoCierre: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="col-span-2 mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeRollModal}
                    className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-amber-600 px-4 py-1 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? "Rolando..." : "Confirmar rolado"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de CIERRE RÁPIDO */}
        {isCloseOpen && closeOp && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Cerrar operación ({closeOp.ticker})
                </h2>
                <button
                  onClick={closeCloseModal}
                  className="text-sm text-slate-500 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>

              <form className="grid gap-3" onSubmit={handleCloseSubmit}>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Fecha de cierre
                  </label>
                  <input
                    type="date"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={closeForm.fechaCierre}
                    onChange={(e) =>
                      setCloseForm((f) => ({
                        ...f,
                        fechaCierre: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Comisión final
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={closeForm.comision}
                    onChange={(e) =>
                      setCloseForm((f) => ({
                        ...f,
                        comision: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Costo cierre (débito/crédito)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={closeForm.costoCierre}
                    onChange={(e) =>
                      setCloseForm((f) => ({
                        ...f,
                        costoCierre: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeCloseModal}
                    className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-emerald-600 px-4 py-1 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? "Cerrando..." : "Confirmar cierre"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal gráfica ROI */}
        {isChartOpen && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-3xl rounded-xl bg-white p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Gráfica ROI por ticker
                </h2>
                <button
                  onClick={() => setIsChartOpen(false)}
                  className="text-sm text-slate-500 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>

              {roiPorTicker.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Aún no hay datos suficientes para mostrar la gráfica.
                </p>
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roiPorTicker}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ticker" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="roi" name="ROI (%)" />
                      <Bar dataKey="neto" name="Neto ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Historial en archivo aparte */}
        <Historial historial={historial} />
      </main>
    </div>
  )
}

// ======================
// Card KPI
// ======================

type CardProps = {
  title: string
  value: number
  isPercentage?: boolean
}

function Card({ title, value, isPercentage }: CardProps) {
  const formatted = isPercentage
    ? `${value.toFixed(2)}%`
    : value.toFixed(2)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">
        {formatted}
      </p>
    </div>
  )
}

export default App
