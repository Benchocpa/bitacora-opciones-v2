import { useEffect, useMemo, useState, FormEvent } from "react"
import { supabase } from "./supabaseClient"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,} from "recharts"
import { getStockPrice } from "./services/priceService"


// Tipo de cómo viene desde la BD (snake_case)
type DbOperacion = {
  id: number
  fecha_inicio: string
  fecha_vencimiento: string | null
  fecha_cierre: string | null
  ticker: string
  estrategia: string
  acciones: number | null
  strike: number | null
  prima_recibida: number | null
  comision: number | null
  costo_cierre: number | null
}

// Tipo que usamos en la app (camelCase)
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
}

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
}

// helper BD → app
function mapDbToOperacion(row: DbOperacion): Operacion {
  return {
    id: row.id,
    fechaInicio: row.fecha_inicio,
    fechaVencimiento: row.fecha_vencimiento,
    fechaCierre: row.fecha_cierre,
    ticker: row.ticker,
    estrategia: row.estrategia,
    acciones: row.acciones ?? 0,
    strike: row.strike ?? 0,
    primaRecibida: row.prima_recibida ?? 0,
    comision: row.comision ?? 0,
    costoCierre: row.costo_cierre ?? 0,
  }
}

type TickerStats = {
  ticker: string
  prima: number
  costos: number
  neto: number
  capitalInv: number
  roi: number
  operaciones: number
  accionesTotales: number
  breakEven: number
}


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

  // Cargar operaciones desde Supabase
  useEffect(() => {
    const fetchOps = async () => {
      setLoadingPage(true)
      setErrorMsg(null)

      const { data, error } = await supabase
        .from("operaciones")
        .select("*")
        .order("fecha_inicio", { ascending: false })

      if (error) {
        console.error("Error al cargar operaciones:", error)
        const msg =
          (error as any)?.message ||
          (error as any)?.error_description ||
          "No se pudieron cargar las operaciones."
        setErrorMsg(msg)
      } else if (data) {
        setOperaciones((data as DbOperacion[]).map(mapDbToOperacion))
      }

      setLoadingPage(false)
    }

    fetchOps()
  }, [])
  async function cargarPrecios() {
  const tickers = Array.from(new Set(operaciones.map(o => o.ticker)))

  const preciosTemp: Record<string, number | null> = {}

  for (const t of tickers) {
    preciosTemp[t] = await getStockPrice(t)
  }

  setPrecios(preciosTemp)
}
useEffect(() => {
  if (operaciones.length > 0) {
    cargarPrecios()
  }
}, [operaciones])


  // KPIs generales
  const stats = useMemo(() => {
    if (operaciones.length === 0) {
      return {
        prima: 0,
        costos: 0,
        neto: 0,
        capitalInv: 0,
        roi: 0,
        cantidad: 0,
      }
    }

    const prima = operaciones.reduce(
      (acc, op) => acc + (op.primaRecibida || 0),
      0
    )

    const costos = operaciones.reduce(
      (acc, op) => acc + (op.comision || 0) + (op.costoCierre || 0),
      0
    )

    const neto = prima - costos

    const capitalInv = operaciones.reduce(
      (acc, op) => acc + (op.acciones || 0) * (op.strike || 0),
      0
    )

    const roi = capitalInv > 0 ? (neto / capitalInv) * 100 : 0

    return {
      prima,
      costos,
      neto,
      capitalInv,
      roi,
      cantidad: operaciones.length,
    }
  }, [operaciones])

  // 🔥 ROI POR TICKER
  const roiPorTicker: TickerStats[] = useMemo(() => {
    if (operaciones.length === 0) return []

    const map = new Map<string, TickerStats>()

    for (const op of operaciones) {
      const key = op.ticker.toUpperCase()

      if (!map.has(key)) {
        map.set(key, {
          ticker: key,
          prima: 0,
          costos: 0,
          neto: 0,
          capitalInv: 0,
          roi: 0,
          operaciones: 0,
          accionesTotales: 0,
          breakEven: 0,
        })
      }

      const item = map.get(key)!
      const prima = op.primaRecibida || 0
      const costos = (op.comision || 0) + (op.costoCierre || 0)
      const capital = (op.acciones || 0) * (op.strike || 0)
      const acciones = op.acciones || 0

      item.prima += prima
      item.costos += costos
      item.capitalInv += capital
      item.operaciones += 1
      item.accionesTotales += acciones
      item.neto = item.prima - item.costos
    }

    const arr = Array.from(map.values()).map((item) => {
      const roi =
        item.capitalInv > 0 ? (item.neto / item.capitalInv) * 100 : 0

      const breakEven =
        item.accionesTotales > 0
          ? (item.capitalInv - item.neto) / item.accionesTotales
          : 0

      return { ...item, roi, breakEven }
    })

    // ordenado por ROI desc (puedes cambiar a neto si quieres)
    arr.sort((a, b) => b.roi - a.roi)

    return arr
  }, [operaciones])

  const openNewForm = () => {
    setEditingId(null)
    setForm(emptyForm)
    setIsFormOpen(true)
  }

  const openEditForm = (op: Operacion) => {
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
    })
    setIsFormOpen(true)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    if (!form.ticker || !form.fechaInicio || !form.estrategia) {
      alert("Faltan campos obligatorios (ticker, fecha de inicio, estrategia).")
      setLoading(false)
      return
    }

    const payload = {
      fecha_inicio: form.fechaInicio,
      fecha_vencimiento: form.fechaVencimiento || null,
      fecha_cierre: form.fechaCierre || null,
      ticker: form.ticker.toUpperCase(),
      estrategia: form.estrategia,
      acciones: Number(form.acciones || 0),
      strike: Number(form.strike || 0),
      prima_recibida: Number(form.primaRecibida || 0),
      comision: Number(form.comision || 0),
      costo_cierre: Number(form.costoCierre || 0),
    }

    try {
      if (editingId == null) {
        const { data, error } = await supabase
          .from("operaciones")
          .insert(payload)
          .select()
          .single()

        if (error) throw error

        setOperaciones((prev) => [
          mapDbToOperacion(data as DbOperacion),
          ...prev,
        ])
      } else {
        const { data, error } = await supabase
          .from("operaciones")
          .update(payload)
          .eq("id", editingId)
          .select()
          .single()

        if (error) throw error

        setOperaciones((prev) =>
          prev.map((op) =>
            op.id === editingId ? mapDbToOperacion(data as DbOperacion) : op
          )
        )
      }

      setIsFormOpen(false)
      setEditingId(null)
      setForm(emptyForm)
    } catch (err: any) {
      console.error("Error al guardar operación:", err)
      const msg =
        err?.message ||
        err?.error_description ||
        "No se pudo guardar la operación."
      setErrorMsg(msg)
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar esta operación?")) return
    setLoading(true)
    setErrorMsg(null)

    try {
      const { error } = await supabase.from("operaciones").delete().eq("id", id)

      if (error) throw error

      setOperaciones((prev) => prev.filter((op) => op.id !== id))
    } catch (err: any) {
      console.error("Error al eliminar operación:", err)
      const msg =
        err?.message ||
        err?.error_description ||
        "No se pudo eliminar la operación."
      setErrorMsg(msg)
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-semibold">Bitácora de Opciones V2</h1>
          <button
            onClick={openNewForm}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Nueva operación
          </button>
        </div>
      </header>

        <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {loadingPage && (
          <p className="text-sm text-slate-500">Cargando operaciones…</p>
        )}
        {errorMsg && (
          <p className="text-sm text-red-600">{errorMsg}</p>
        )}

        {/* KPIs generales */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
          <Card title="Prima" value={stats.prima} />
          <Card title="Costos" value={stats.costos} />
          <Card title="Neto" value={stats.neto} />
          <Card title="ROI General" value={stats.roi} isPercentage />
          <Card title="Operaciones" value={stats.cantidad} decimals={0} />
          <Card title="Capital Inv." value={stats.capitalInv} />
        </div>

        {/* 🔥 ROI POR TICKER */}
        <section className="rounded-xl bg-white p-4 shadow-sm">
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
                    <th className="px-2 py-2">Precio</th>
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
                          : "-"}
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
                      <td className="px-2 py-2 text-right">
                        {item.neto.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {item.capitalInv.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        {item.breakEven.toFixed(2)}
                      </td>
                      <td className="px-2 py-2 text-right">
                         {item.roi.toFixed(2)}%
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Tabla de operaciones */}
        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">
            Operaciones registradas
          </h2>

          {operaciones.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no tienes operaciones en la base de datos. Haz clic en{" "}
              <span className="font-semibold">“Nueva operación”</span> para
              registrar la primera.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <th className="px-2 py-2">Ticker</th>
                    <th className="px-2 py-2">Estrategia</th>
                    <th className="px-2 py-2">F. Inicio</th>
                    <th className="px-2 py-2">F. Venc.</th>
                    <th className="px-2 py-2 text-right">Acciones</th>
                    <th className="px-2 py-2 text-right">Strike</th>
                    <th className="px-2 py-2 text-right">Prima</th>
                    <th className="px-2 py-2 text-right">Comisión</th>
                    <th className="px-2 py-2 text-right">Costo cierre</th>
                    <th className="px-2 py-2">Acciones</th>
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
                      <td className="px-2 py-2">{op.fechaInicio}</td>
                      <td className="px-2 py-2">
                        {op.fechaVencimiento}
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
                      <td className="px-2 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditForm(op)}
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
          <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-xl rounded-xl bg-white p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {editingId ? "Editar operación" : "Nueva operación"}
                </h2>
                <button
                  onClick={() => {
                    setIsFormOpen(false)
                    setEditingId(null)
                    setForm(emptyForm)
                  }}
                  className="text-sm text-slate-500 hover:text-slate-800"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 gap-3 md:grid-cols-2"
              >
                <InputField
                  label="Fecha inicio"
                  type="date"
                  name="fechaInicio"
                  value={form.fechaInicio}
                  onChange={handleChange}
                  required
                />
                <InputField
                  label="Fecha vencimiento"
                  type="date"
                  name="fechaVencimiento"
                  value={form.fechaVencimiento}
                  onChange={handleChange}
                />
                <InputField
                  label="Fecha cierre"
                  type="date"
                  name="fechaCierre"
                  value={form.fechaCierre}
                  onChange={handleChange}
                />
                <InputField
                  label="Ticker"
                  type="text"
                  name="ticker"
                  value={form.ticker}
                  onChange={handleChange}
                  placeholder="INTC, CLSK, etc."
                  required
                />

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium">Estrategia</label>
                  <select
                    name="estrategia"
                    value={form.estrategia}
                    onChange={handleChange}
                    className="rounded-md border px-2 py-1 text-sm"
                    required
                  >
                    <option value="">Selecciona…</option>
                    <option value="CSP">Cash Secured Put</option>
                    <option value="CC">Covered Call</option>
                    <option value="Spread">Spread</option>
                    <option value="Iron Condor">Iron Condor</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>

                <InputField
                  label="Acciones"
                  type="number"
                  name="acciones"
                  value={form.acciones}
                  onChange={handleChange}
                />
                <InputField
                  label="Strike"
                  type="number"
                  name="strike"
                  value={form.strike}
                  onChange={handleChange}
                  step="0.01"
                />
                <InputField
                  label="Prima recibida"
                  type="number"
                  name="primaRecibida"
                  value={form.primaRecibida}
                  onChange={handleChange}
                  step="0.01"
                />
                <InputField
                  label="Comisión"
                  type="number"
                  name="comision"
                  value={form.comision}
                  onChange={handleChange}
                  step="0.01"
                />
                <InputField
                  label="Costo de cierre"
                  type="number"
                  name="costoCierre"
                  value={form.costoCierre}
                  onChange={handleChange}
                  step="0.01"
                />

                <div className="col-span-1 mt-3 flex justify-end gap-2 md:col-span-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false)
                      setEditingId(null)
                      setForm(emptyForm)
                    }}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {isChartOpen && (
  <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
    <div className="w-full max-w-3xl rounded-xl bg-white p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gráfica ROI por ticker</h2>
        <button
          onClick={() => setIsChartOpen(false)}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ✕
        </button>
      </div>

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
    </div>
  </div>
)}

      </main>
    </div>
  )
}

type CardProps = {
  title: string
  value: number
  isPercentage?: boolean
  decimals?: number
}

function Card({ title, value, isPercentage, decimals = 2 }: CardProps) {
  const formatted = isPercentage
    ? `${value.toFixed(2)}%`
    : value.toFixed(decimals)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">
        {formatted}
      </p>
    </div>
  )
}

type InputFieldProps = {
  label: string
  name: string
  value: string
  type?: string
  step?: string
  placeholder?: string
  required?: boolean
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void
}

function InputField({
  label,
  name,
  value,
  type = "text",
  step,
  placeholder,
  required,
  onChange,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        step={step}
        placeholder={placeholder}
        required={required}
        className="rounded-md border px-2 py-1 text-sm"
      />
    </div>
  )
}

export default App
