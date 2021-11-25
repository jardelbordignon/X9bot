import express from 'express'
import 'dotenv/config'
import WS from 'ws'
import { Telegraf } from 'telegraf'
import axios from 'axios'

import { formatDate } from '@/utils/formatters'

interface ITradeOperation {
  tokenQuantity: number
  closingValue: number
  operationType: 'purchase' | 'sale'
  date?: Date
}

const calcRSI = (prices: any) => {
  let gains = 0, losses = 0

  for (let i = prices.length - 14; i < prices.length; i++) {
    const difference = prices[i] - prices[i - 1]
    if (difference >= 0)
      gains += difference
    else
      losses -= difference
  }

  const relativeStrength = gains / losses
  const rsi = 100 - (100 / (1 + relativeStrength))

  return rsi
}

(async () => {
  const binance_ws_uri = 'wss://stream.binance.com:9443/ws'
  const binance_api_uri = 'https://api.binance.com/api/v3'
  
  const currency = 'shibbrl'
  const period = '1m'
  
  const candles = await axios.get(`${binance_api_uri}/klines?symbol=${currency.toUpperCase()}&interval=${period}`)
  const candleCloses = candles.data.map((candle: any) => parseFloat(candle[4]))
  console.log(candleCloses);
  
  const ws = new WS(`${binance_ws_uri}/${currency}@kline_${period}`)
  const { telegram } = new Telegraf(process.env.TELEGRAM_API_TOKEN)
  
  const initialOperation: ITradeOperation = {
    tokenQuantity: 30, closingValue: 4202.02, operationType: 'purchase', date: new Date()
  }
  
  const tradeOperations: ITradeOperation[] = [initialOperation]
  let balance = { purchase: 0, sale: 0, tax: 0 }
  
  let previousClosingValue: number
  
  const tradeOperation = ({tokenQuantity, closingValue, operationType}: ITradeOperation): void => {
    const date = new Date()
    
    tradeOperations.push({ tokenQuantity, closingValue, operationType, date })
    console.log(tradeOperations)
  
    const message = `
    Operação de ${operationType === 'purchase' ? 'Compra' : 'Venda'} às ${formatDate({date})}:
    Cotação do token: ${closingValue}
    Valor total negociado: ${closingValue * tokenQuantity}
  
    `
    // telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, message)
  }
  
  ws.onmessage = async (event: any): Promise<void> => {
    const data = JSON.parse(event.data)
    const closingValue = parseFloat(data.k.c)
    const isCandleClosed = data.k.x

    if (isCandleClosed) {
      candleCloses.push(closingValue)
      const rsi = calcRSI(candleCloses)

      console.log(rsi.toFixed(2))
      console.log(closingValue)
          
      if (rsi > 70) {
        console.log('Sobrecomprado - tendência de queda')
      } else if (rsi < 30) {
        console.log('Sobrevendido - tendência de alta')
      }
    }
    // const highClosingValue = parseFloat(data.k.h)
    // const lowTokenQuotation = parseFloat(data.k.l)
  
    // const salePoint = closingValue >= highClosingValue - highClosingValue * 0.001
    // const purchasePoint = closingValue < lowTokenQuotation + lowTokenQuotation * 0.001
  
    // console.log('-------------');
    
    // console.log('c', closingValue)
    // console.log('h', highClosingValue, ' sal', highClosingValue - highClosingValue * 0.0015)
    // console.log('l', lowTokenQuotation, ' pur', lowTokenQuotation + lowTokenQuotation * 0.0015)
    
  
    // if (salePoint) { // subiu até o ponto de venda
    //   if (closingValue < previousClosingValue) { // foi subindo até onde deu e começou a descer 
    //     tradeOperation({ tokenQuantity: 10, closingValue, operationType: 'sale' })
    //   }
    // }
    
    // if (purchasePoint) { // desceu em no ponto de compra
    //   if (closingValue > previousClosingValue) // foi descendo até onde deu e começou a subir
    //     tradeOperation({ tokenQuantity: 10, closingValue, operationType: 'purchase' })
    // }
  
    // previousClosingValue = closingValue
  }

})()

const app = express()

app.use(express.json())

app.listen(3000, () => console.log('🚀 Server running'))
