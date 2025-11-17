const API_KEY = import.meta.env.VITE_STOCK_API_KEY

export async function getStockPrice(rawTicker: string): Promise<number | null> {
  try {
    const ticker = rawTicker.trim().toUpperCase()

    if (!API_KEY) {
      console.error("Falta VITE_STOCK_API_KEY en el .env (build)")
      return null
    }

    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${API_KEY}`

    const res = await fetch(url)
    const data = await res.json()

    // 👇 nuevo: detectar límite o mensaje "Information"
    if (data.Note || data.Information) {
      console.warn(
        "Alpha Vantage límite diario / premium:",
        data.Note ?? data.Information,
      )
      return null
    }

    if (data["Error Message"]) {
      console.warn("Error de Alpha Vantage:", data["Error Message"])
      return null
    }

    const priceStr = data?.["Global Quote"]?.["05. price"]
    const price = priceStr ? Number(priceStr) : null

    if (price == null || Number.isNaN(price)) {
      console.warn("No se encontró precio para", ticker, data)
      return null
    }

    return price
  } catch (error) {
    console.error("Error obteniendo precio:", error)
    return null
  }
}
