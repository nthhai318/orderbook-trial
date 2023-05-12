"use client";

import { useEffect, useRef, useState } from "react";

type Order = [number, number, number?];

const message = {
  event: "subscribe",
  feed: "book_ui_1",
  product_ids: ["PI_XBTUSD"],
};

export default function OrderBook() {
  const [feedData, setFeedData] = useState<{ bids: Order[]; asks: Order[] }>({
    bids: [],
    asks: [],
  });
  const maxSize = useRef({ maxBid: 0, maxAsk: 0 });
  useEffect(() => {
    const ws = new WebSocket("wss://www.cryptofacilities.com/ws/v1");

    ws.onopen = () => {
      ws.send(JSON.stringify(message));
    };

    let bids: Order[] = [];
    let maxBidSize = 0;
    let asks: Order[] = [];
    let maxAskSize = 0;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.feed === "book_ui_1_snapshot") {
        // Processing snapshot Data
        bids = data.bids;
        maxBidSize = getMaxSize(bids);
        asks = data.asks;
        maxAskSize = getMaxSize(asks);
      } else if (data.feed === "book_ui_1" && data.event !== "subscribed") {
        // Processing updated delta data
        data.bids.forEach((deltaOrder: Order) => {
          if (deltaOrder[1] === 0) {
            bids = bids.filter((bid) => bid[0] !== deltaOrder[0]);
            maxBidSize = getMaxSize(bids);
          } else {
            bids = bids.filter((bid) => bid[0] !== deltaOrder[0]);
            bids.push(deltaOrder);
            maxBidSize = getMaxSize(bids);
          }
        });
        data.asks.forEach((deltaOrder: Order) => {
          if (deltaOrder[1] === 0) {
            asks = asks.filter((ask) => ask[0] !== deltaOrder[0]);
            maxAskSize = getMaxSize(asks);
          } else {
            asks = asks.filter((ask) => ask[0] !== deltaOrder[0]);
            asks.push(deltaOrder);
            maxAskSize = getMaxSize(asks);
          }
        });
      }
      bids.sort((a, b) => b[0] - a[0]);
      asks.sort((a, b) => a[0] - b[0]);
      // Adding total size value
      let totalBid = 0;
      bids.forEach((bid) => {
        totalBid += bid[1];
        bid[2] = totalBid;
      });
      let totalAsk = 0;
      asks.forEach((ask) => {
        totalAsk += ask[1];
        ask[2] = totalAsk;
      });
      setFeedData({ bids, asks });
      maxSize.current = { maxBid: maxBidSize, maxAsk: maxAskSize };
    };

    return () => {
      ws.close();
    };
  }, []);
  return (
    <div className="flex items-start mt-10">
      <table className="h-fit">
        <thead>
          <tr>
            <th className="w-[150px] text-right">Total Bid</th>
            <th className="w-[150px] text-right">Bid Size</th>
            <th className="w-[150px] text-right">Bid Price</th>
          </tr>
        </thead>
        <tbody>
          {feedData.bids.map((bid) => {
            return (
              <tr key={bid[0]}>
                <td className="w-[150px] text-right">
                  {bid[2]!.toLocaleString()}
                </td>
                <td className="w-[150px] text-right">
                  {bid[1].toLocaleString()}
                </td>
                <td className="w-[150px] text-right">
                  {bid[0].toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <table className="h-fit">
        <thead>
          <tr>
            <th className="w-[150px] text-right">Ask Price</th>
            <th className="w-[150px] text-right">Ask Size</th>
            <th className="w-[150px] text-right">Total Ask</th>
          </tr>
        </thead>
        <tbody>
          {feedData.asks.map((ask) => {
            return (
              <tr key={ask[0]}>
                <td className="w-[150px] text-right">
                  {ask[0].toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="w-[150px] text-right">
                  {ask[1].toLocaleString()}
                </td>
                <td className="w-[150px] text-right">
                  {ask[2]!.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function getMaxSize(orders: Order[]) {
  let max: number = 0;
  orders.forEach((order) => {
    if (order[1] > max) {
      max = order[1];
    }
  });
  return max;
}
