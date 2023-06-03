export type CoinModel = {
    id: string,
    symbol: string,
    name:  string,
    image: string,
    current_price: number,
    market_cap: number,
    market_cap_rank: number,
    fully_diluted_valuation: number,
    total_volume: number,
    high_24h: number,
    low_24h: number,
    price_change_24h: number,
    price_change_percentage_24h: number,
    market_cap_change_24h: number,
    market_cap_change_percentage_24h: number,
    circulating_supply: number,
    total_supply: number,
    max_supply: number,
    ath: number,
    ath_change_percentage: number,
    ath_date: string,
    atl: number,
    atl_change_percentage: number,
    atl_date: string,
    roi: any,
    last_updated: string
}


export

/**
 * {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579',
        current_price: 27082,
        market_cap: 525485320896,
        market_cap_rank: 1,
        fully_diluted_valuation: 569086506908,
        total_volume: 11595096262,
        high_24h: 27208,
        low_24h: 26716,
        price_change_24h: -92.40237385964792,
        price_change_percentage_24h: -0.34004,
        market_cap_change_24h: 4859708373,
        market_cap_change_percentage_24h: 0.93344,
        circulating_supply: 19391062,
        total_supply: 21000000,
        max_supply: 21000000,
        ath: 69045,
        ath_change_percentage: -60.75733,
        ath_date: '2021-11-10T14:24:11.849Z',
        atl: 67.81,
        atl_change_percentage: 39857.84109,
        atl_date: '2013-07-06T00:00:00.000Z',
        roi: null,
        last_updated: '2023-06-02T16:59:58.734Z'
      }
 */