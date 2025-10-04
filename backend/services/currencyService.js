const axios = require('axios');

class CurrencyService {
  constructor() {
    this.countriesApiUrl = 'https://restcountries.com/v3.1/all?fields=name,currencies';
    this.exchangeApiUrl = 'https://api.exchangerate-api.com/v4/latest';
    this.countriesCache = null;
    this.exchangeRatesCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Get all countries with their currencies
  async getCountriesWithCurrencies() {
    try {
      if (this.countriesCache && this.isCacheValid(this.countriesCache.timestamp)) {
        return this.countriesCache.data;
      }

      const response = await axios.get(this.countriesApiUrl);
      const countries = response.data.map(country => ({
        name: country.name.common,
        currency: country.currencies ? Object.keys(country.currencies)[0] : 'USD'
      }));

      this.countriesCache = {
        data: countries,
        timestamp: Date.now()
      };

      return countries;
    } catch (error) {
      console.error('Error fetching countries:', error);
      throw new Error('Failed to fetch countries data');
    }
  }

  // Get exchange rates for a base currency
  async getExchangeRates(baseCurrency) {
    try {
      const cacheKey = baseCurrency;
      
      if (this.exchangeRatesCache.has(cacheKey) && 
          this.isCacheValid(this.exchangeRatesCache.get(cacheKey).timestamp)) {
        return this.exchangeRatesCache.get(cacheKey).data;
      }

      const response = await axios.get(`${this.exchangeApiUrl}/${baseCurrency}`);
      const rates = response.data.rates;

      this.exchangeRatesCache.set(cacheKey, {
        data: rates,
        timestamp: Date.now()
      });

      return rates;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      throw new Error('Failed to fetch exchange rates');
    }
  }

  // Convert amount from one currency to another
  async convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      if (fromCurrency === toCurrency) {
        return {
          originalAmount: amount,
          convertedAmount: amount,
          exchangeRate: 1,
          fromCurrency,
          toCurrency
        };
      }

      const rates = await this.getExchangeRates(fromCurrency);
      
      if (!rates[toCurrency]) {
        throw new Error(`Exchange rate not found for ${toCurrency}`);
      }

      const exchangeRate = rates[toCurrency];
      const convertedAmount = amount * exchangeRate;

      return {
        originalAmount: amount,
        convertedAmount: parseFloat(convertedAmount.toFixed(2)),
        exchangeRate: parseFloat(exchangeRate.toFixed(6)),
        fromCurrency,
        toCurrency
      };
    } catch (error) {
      console.error('Error converting currency:', error);
      throw new Error('Failed to convert currency');
    }
  }

  // Get currency for a specific country
  async getCurrencyForCountry(countryName) {
    try {
      const countries = await this.getCountriesWithCurrencies();
      const country = countries.find(c => 
        c.name.toLowerCase() === countryName.toLowerCase()
      );
      
      return country ? country.currency : 'USD';
    } catch (error) {
      console.error('Error getting currency for country:', error);
      return 'USD'; // Default fallback
    }
  }

  // Check if cache is still valid
  isCacheValid(timestamp) {
    return Date.now() - timestamp < this.cacheExpiry;
  }

  // Clear all caches
  clearCache() {
    this.countriesCache = null;
    this.exchangeRatesCache.clear();
  }
}

module.exports = new CurrencyService();