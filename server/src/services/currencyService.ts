import axios from 'axios';

export async function getCompanyCurrencyForCountry(countryCode: string): Promise<string> {
  // Using restcountries to get currency by country code
  // countryCode: ISO 3166-1 alpha-2 or alpha-3; restcountries supports both
  const url = `https://restcountries.com/v3.1/alpha/${countryCode}?fields=currencies`;
  const resp = await axios.get(url);
  const currencies = resp.data?.[0]?.currencies || resp.data?.currencies;
  const codes = currencies ? Object.keys(currencies) : [];
  if (!codes.length) throw new Error('Could not determine currency for country');
  return codes[0];
}

export async function convertToBaseCurrency(baseCurrency: string, amount: number, fromCurrency: string): Promise<{ converted: number; rate: number; }>{
  if (fromCurrency === baseCurrency) return { converted: amount, rate: 1 };
  const url = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;
  const { data } = await axios.get(url);
  const rate = data?.rates?.[baseCurrency];
  if (!rate) throw new Error('Conversion rate not found');
  return { converted: Number((amount * rate).toFixed(2)), rate };
}
