type FormatCurrencyType = {
  amount: number;
  language?: string;
  currency?: string;
};

type FormatDateType = {
  date: string | Date;
  language?: string;
  toText?: boolean;
};

export const formatCurrency = ({
  amount,
  language = 'pt-BR',
  currency = 'BRL'
}: FormatCurrencyType): string =>
  amount.toLocaleString(language, { style: 'currency', currency });

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleDateString
const options = {
  hour: '2-digit' as '2-digit' | 'numeric',
  minute: '2-digit'  as '2-digit' | 'numeric'
};

const dateOptions = {
  weekday: 'long' as 'long' | 'short' | 'narrow',
  day: 'numeric' as 'numeric' | '2-digit',
  month: 'long' as 'long' | 'short' | 'narrow' | 'numeric' | '2-digit',
  year: 'numeric' as 'numeric' | '2-digit'
};

export const formatDate = ({
  date,
  language = undefined,
  toText = false
}: FormatDateType) => {
  if (toText) Object.assign(options, dateOptions)
  return new Date(date).toLocaleDateString(language, options)
}
