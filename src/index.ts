import express from 'express'
import 'dotenv/config'
import WS from 'ws'

interface ITradeOperation {
  amount: number
  type: 'purchase' | 'sale'
  currentPrice: number
  date?: Date
}

const binance_ws_uri = 'wss://stream.binance.com:9443/ws'
const currency = 'ethbusd'
const period = '1h'

const ws = new WS(`${binance_ws_uri}/${currency}@kline_${period}`)

const tradeOperations: ITradeOperation[] = []

const getBalance = () => {
  const balance = { purchase: 0, sale: 0, total: 0 }

  tradeOperations.forEach(operation => balance[operation.type] += operation.amount)

  balance.total = balance.purchase - balance.sale

  return balance
}

const tradeOperation = ({amount, type, currentPrice}: ITradeOperation): void => {
  tradeOperations.push({ amount, type, currentPrice, date: new Date() })
  console.log(tradeOperations)
}

ws.onmessage = async (event: any): Promise<void> => {
  const data = JSON.parse(event.data)
  const currentPrice = parseFloat(data.k.c)
  const highPrice = parseFloat(data.k.h)
  const lowPrice = parseFloat(data.k.l)

  console.log(`Valor atual: ${currentPrice}`)
  console.log(`Menor valor em ${period}: ${lowPrice}`)
  console.log(`Maior valor em ${period}: ${highPrice}`)

  if (currentPrice >= highPrice) {
    const amount = getBalance().total
    tradeOperation({ amount, currentPrice, type: 'sale'})
  } else if (currentPrice < lowPrice) {
    tradeOperation({ amount: 1000, currentPrice, type: 'purchase'})
  }
}

const app = express()

app.use(express.json())

app.listen(3000, () => console.log('🚀 Server running'))
