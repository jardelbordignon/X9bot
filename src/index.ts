import express from 'express'
import 'dotenv/config'
import WS from 'ws'
import { Telegraf } from 'telegraf'

import { formatDate } from '@/utils/formatters'

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
const { telegram } = new Telegraf(process.env.TELEGRAM_API_TOKEN)

const initialOperation: ITradeOperation = {
  amount: 3000, type: 'purchase', currentPrice: 4202.02, date: new Date()
}

const tradeOperations: ITradeOperation[] = [initialOperation]

const getBalance = () => {
  const balance = { purchase: 0, sale: 0, total: 0 }
  tradeOperations.forEach(operation => balance[operation.type] += operation.amount)
  balance.total = balance.purchase - balance.sale

  return balance
}

const tradeOperation = ({amount, type, currentPrice}: ITradeOperation): void => {
  const date = new Date()
  tradeOperations.push({ amount, type, currentPrice, date })
  console.log(tradeOperations)

  const message = `
  Operação de ${type === 'purchase' ? 'Compra' : 'Venda'} às ${formatDate({date})}:
  Valor no momento: ${currentPrice}
  Valor total negociado: ${amount}

  `
  telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, message)
}

ws.onmessage = async (event: any): Promise<void> => {
  const data = JSON.parse(event.data)
  const currentPrice = parseFloat(data.k.c)
  const highPrice = parseFloat(data.k.h)
  const lowPrice = parseFloat(data.k.l)

  console.log(`Valor atual: ${currentPrice}`)
  console.log(`Menor valor em ${period}: ${lowPrice}`)
  console.log(`Maior valor em ${period}: ${highPrice}`)
  console.log(formatDate({ date: new Date(), toText: true}))

  if (currentPrice >= highPrice) {
    const amount = getBalance().total
    if (amount > 0)
      tradeOperation({ amount, currentPrice, type: 'sale'})
  } else if (currentPrice < lowPrice) {
    tradeOperation({ amount: 1000, currentPrice, type: 'purchase'})
  }
}

const app = express()

app.use(express.json())

app.listen(3000, () => console.log('🚀 Server running'))
