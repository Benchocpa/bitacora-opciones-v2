import React, { useEffect, useMemo, useState } from "react"
import { supabase } from "./supabaseClient"
import { getStockPrice } from "./services/priceService"
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
  comision: number
  costoCierre: number
  capitalInv: number
  neto: number
  roi: number
  estado: string
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
        const prima = Number(row.prima_recibida ?? row.primaRecibida ?? 0)
        const comision = Number(row.comision ?? 0)
        const costoCierre = Number(row.costo_cierre ?? row.costoCierre ?? 0)

        const capitalInv = acciones * strike
        const neto = prima - comision - costoCierre
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
            row.fecha_cierre ??
            row.fechaCierre ??
            row.fechacierre ??
            null,
          ticker: (row.ticker ?? "").toUpperCase(),
          estrategia: row.estrategia ?? row.estretegia ?? "",
          acciones,
          strike,
          primaRecibida: prima,
          comision,
          costoCierre,
          capitalInv,
          neto,
          roi,
          estado: row.estado ?? "Abierta",
        }
      }) ?? []

    setOperaciones(parsed)
    setLoadingPage(false)
  }

  useEffect(() => {
    cargarOperaciones()
  }, [])

  // ======================
  // Cargar precios con Alpha Vantage (priceService)
  // ======================

  async function cargarPrecios() {
    const tickers = Array.from(
      new Set(operaciones.map((o) => o.ticker.trim().toUpperCase())),
    )

    const temp: Record<string, number | null> = {}

    for (const t of tickers) {
      temp[t] = await getStockPrice(t)
    }

    setPrecios(temp)
  }

  useEffect(() => {
  if (operaciones.length > 0 && !preciosCargados) {
    setPreciosCargados(true)
    cargarPrecios()
  }
}, [operaciones, preciosCargados])

  // ======================
  // Cálculos derivados (useMemo)
  // ======================

  const totalPrima = useMemo(
    () => operaciones.reduce((acc, op) => acc + op.primaRecibida, 0),
    [operaciones],
  )

  const totalCostos = useMemo(
    () => operaciones.reduce((acc, op) => acc + op.comision + op.costoCierre, 0),
    [operaciones],
  )

  const totalNeto = useMemo(
    () => operaciones.reduce((acc, op) => acc + op.neto, 0),
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
        })
      }

      const item = mapa.get(op.ticker)!
      item.operaciones += 1
      item.prima += op.primaRecibida
      item.costos += op.comision + op.costoCierre
      item.neto += op.neto
      item.capitalInv += op.capitalInv

      // break-even aproximado: strike - (prima / acciones)
      const primaPorAccion =
        op.acciones > 0 ? op.primaRecibida / op.acciones : 0
      const be = op.strike - primaPorAccion
      item.breakEven = be
    }

    for (const item of mapa.values()) {
      item.roi =
        item.capitalInv > 0 ? (item.neto / item.capitalInv) * 100 : 0
    }

    return Array.from(mapa.values())
  }, [operaciones])

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
    })
    setIsFormOpen(true)
  }

  function closeForm() {
    setIsFormOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const payload = {
        fecha_inicio: form.fechaInicio || null,
        fecha_vencimiento: form.fechaVencimiento || null,
        fecha_cierre: form.fechaCierre || null,
        ticker: form.ticker.trim().toUpperCase(),
        estrategia: form.estrategia,
        acciones: Number(form.acciones || 0),
        strike: Number(form.strike || 0),
        prima_recibida: Number(form.primaRecibida || 0),
        comision: Number(form.comision || 0),
        costo_cierre: Number(form.costoCierre || 0),
        estado: form.estado || "Abierta",
      }

      if (editingId == null) {
        const { error } = await supabase.from("operaciones").insert(payload)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("operaciones")
          .update(payload)
          .eq("id", editingId)
        if (error) throw error
      }

      await cargarOperaciones()
      closeForm()
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
      const { error } = await supabase
        .from("operaciones")
        .delete()
        .eq("id", id)
      if (error) throw error
      await cargarOperaciones()
    } catch (err: any) {
      console.error(err)
      setErrorMsg("No se pudo eliminar la operación")
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
          <h1 className="text-xl font-semibold">
            Bitácora de Opciones V2
          </h1>
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
                    <th className="px-2 py-2 text-right">Operaciones</th>
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
                      <td className="px-2 py-2 font-medium">
                        {item.ticker}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {precios[item.ticker] != null
                          ? precios[item.ticker]!.toFixed(2)
                          : "–"}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {item.operaciones}
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
                    <th className="px-2 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {operaciones.map((op) => (
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
                      <td className="px-2 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(op)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(op.id)}
                            className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                  onClick={closeForm}
                  className="text-sm text-slate-500 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>

              <form
                className="grid gap-3 md:grid-cols-2"
                onSubmit={handleSubmit}
              >
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Ticker
                  </label>
                  <input
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={form.ticker}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        ticker: e.target.value.toUpperCase(),
                      }))
                    }
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-slate-600">
                    Estrategia
                  </label>
                  <input
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={form.estrategia}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, estrategia: e.target.value }))
                    }
                  />
                </div>

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

                <div className="col-span-2 mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeForm}
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
