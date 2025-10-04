"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCompanyCurrencyForCountry = getCompanyCurrencyForCountry;
exports.convertToBaseCurrency = convertToBaseCurrency;
const axios_1 = __importDefault(require("axios"));
async function getCompanyCurrencyForCountry(countryCode) {
    // Using restcountries to get currency by country code
    // countryCode: ISO 3166-1 alpha-2 or alpha-3; restcountries supports both
    const url = `https://restcountries.com/v3.1/alpha/${countryCode}?fields=currencies`;
    const resp = await axios_1.default.get(url);
    const currencies = resp.data?.[0]?.currencies || resp.data?.currencies;
    const codes = currencies ? Object.keys(currencies) : [];
    if (!codes.length)
        throw new Error('Could not determine currency for country');
    return codes[0];
}
async function convertToBaseCurrency(baseCurrency, amount, fromCurrency) {
    if (fromCurrency === baseCurrency)
        return { converted: amount, rate: 1 };
    const url = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;
    const { data } = await axios_1.default.get(url);
    const rate = data?.rates?.[baseCurrency];
    if (!rate)
        throw new Error('Conversion rate not found');
    return { converted: Number((amount * rate).toFixed(2)), rate };
}
