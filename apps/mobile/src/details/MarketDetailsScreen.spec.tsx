import * as React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import type { MarketState, PairMetadata } from '@pulse-crypto/contracts';
import { resetMarketStore, useMarketStore } from '../state/market-store';
import { MarketDetailsScreen } from './MarketDetailsScreen';

const btcMeta: PairMetadata = {
  symbol: 'BTCUSDT',
  displayName: 'BTC / USDT',
  tradingStatus: 'TRADING',
  high24h: 1,
  low24h: 0.5,
  volume24h: 10,
};

const btc: MarketState = {
  pair: 'BTCUSDT',
  lastPrice: 65000.5,
  change24hPercent: 1.25,
  high24h: 66000,
  low24h: 64000,
  volume24h: 10,
  spread: 1.5,
  buyPressure: 55.2,
  sellPressure: 44.8,
  bids: [{ price: 65000, quantity: 1.2 }],
  asks: [{ price: 65001.5, quantity: 0.8 }],
  updatedAt: 1_720_802_025_000,
};

describe('MarketDetailsScreen', () => {
  beforeEach(() => {
    resetMarketStore();
  });

  it('renders price, pressure, spread, order book, and timestamp', () => {
    useMarketStore.getState().setPairs([btcMeta]);
    useMarketStore.getState().applySnapshot([btc]);

    const { getByTestId } = render(
      <MarketDetailsScreen pair="BTCUSDT" onBack={() => undefined} />,
    );

    expect(getByTestId('details-title')).toHaveTextContent('BTC / USDT');
    expect(getByTestId('details-price')).toHaveTextContent('65,000.50');
    expect(getByTestId('details-spread')).toHaveTextContent('1.50');
    expect(getByTestId('details-buy-pressure')).toHaveTextContent('55.2%');
    expect(getByTestId('details-sell-pressure')).toHaveTextContent('44.8%');
    expect(getByTestId('bid-0-price')).toHaveTextContent('65,000.00');
    expect(getByTestId('bid-0-quantity')).toHaveTextContent('1.2');
    expect(getByTestId('ask-0-price')).toHaveTextContent('65,001.50');
    expect(getByTestId('ask-0-quantity')).toHaveTextContent('0.8');
    expect(getByTestId('details-updated-at')).toHaveTextContent(
      /2024-07-12T16:33:45.000Z/,
    );
  });

  it('keeps last details visible after disconnect', () => {
    useMarketStore.getState().applySnapshot([btc]);
    useMarketStore.getState().setConnectionStatus('disconnected');

    const { getByTestId } = render(
      <MarketDetailsScreen pair="BTCUSDT" onBack={() => undefined} />,
    );

    expect(getByTestId('connection-status')).toHaveTextContent('Disconnected');
    expect(getByTestId('details-price')).toHaveTextContent('65,000.50');
    expect(getByTestId('order-book')).toBeTruthy();
    expect(getByTestId('stale-data-hint')).toBeTruthy();
  });

  it('explains an empty details view while connecting', () => {
    useMarketStore.getState().setConnectionStatus('connecting');
    const { getByTestId } = render(
      <MarketDetailsScreen pair="BTCUSDT" onBack={() => undefined} />,
    );
    expect(getByTestId('details-empty')).toHaveTextContent(
      /Connecting to live market data/,
    );
  });

  it('accepts a stream of full-depth snapshots without throwing', () => {
    const deep: MarketState = {
      ...btc,
      bids: Array.from({ length: 10 }, (_, index) => ({
        price: 65000 - index,
        quantity: 1 + index,
      })),
      asks: Array.from({ length: 10 }, (_, index) => ({
        price: 65001 + index,
        quantity: 1 + index,
      })),
    };
    useMarketStore.getState().applySnapshot([deep]);

    const { getByTestId } = render(
      <MarketDetailsScreen pair="BTCUSDT" onBack={() => undefined} />,
    );
    expect(getByTestId('order-book')).toBeTruthy();
    expect(getByTestId('bid-9-price')).toBeTruthy();

    for (let tick = 1; tick <= 40; tick += 1) {
      act(() => {
        useMarketStore.getState().applySnapshot([
          {
            ...deep,
            lastPrice: 65000.5 + tick,
            bids: deep.bids.map((level, index) => ({
              ...level,
              quantity: level.quantity + tick * 0.01 + index,
            })),
            asks: deep.asks.map((level, index) => ({
              ...level,
              quantity: level.quantity + tick * 0.02 + index,
            })),
            updatedAt: tick,
          },
        ]);
      });
    }

    expect(getByTestId('order-book')).toBeTruthy();
    expect(getByTestId('details-price')).toBeTruthy();
  });

  it('invokes back', () => {
    const onBack = jest.fn();
    const { getByTestId } = render(
      <MarketDetailsScreen pair="BTCUSDT" onBack={onBack} />,
    );

    fireEvent.press(getByTestId('details-back'));
    expect(onBack).toHaveBeenCalled();
  });
});
