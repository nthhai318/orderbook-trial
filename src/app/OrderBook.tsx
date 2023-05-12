"use client";

import { stringify } from "querystring";
import { useEffect, useRef, useState } from "react";

// Order represent value in order: price , size, total
type Order = [number, number, number?];

const wsURL = "wss://www.cryptofacilities.com/ws/v1";

const coinOption = {
  XBT: {
    message: {
      event: "subscribe",
      feed: "book_ui_1",
      product_ids: ["PI_XBTUSD"],
    },
    gap: [0.5, 1, 2.5],
  },
  ETH: {
    message: {
      event: "subscribe",
      feed: "book_ui_1",
      product_ids: ["PI_ETHUSD"],
    },
    gap: [0.05, 0.1, 0.25],
  },
};

export default function OrderBook() {
  const [coin, setCoin] = useState<"XBT" | "ETH">("XBT");
  const [feedData, setFeedData] = useState<{ bids: Order[]; asks: Order[] }>({
    bids: [],
    asks: [],
  });
  const [gap, setGap] = useState<number>(coinOption[coin].gap[0]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  useEffect(() => {
    const ws = new WebSocket(wsURL);
    ws.onopen = () => {
      ws.send(JSON.stringify(coinOption["XBT"].message));
    };

    let bids: Order[] = [];
    let asks: Order[] = [];

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.feed === "book_ui_1_snapshot") {
        // Processing snapshot Data
        bids = data.bids;
        asks = data.asks;
      } else if (
        data.feed === "book_ui_1" &&
        data.event !== "subscribed" &&
        data.event !== "unsubscribed"
      ) {
        // Processing updated delta data
        data.bids.forEach((deltaOrder: Order) => {
          if (deltaOrder[1] === 0) {
            bids = bids.filter((bid) => bid[0] !== deltaOrder[0]);
          } else {
            bids = bids.filter((bid) => bid[0] !== deltaOrder[0]);
            bids.push(deltaOrder);
          }
        });
        data.asks.forEach((deltaOrder: Order) => {
          if (deltaOrder[1] === 0) {
            asks = asks.filter((ask) => ask[0] !== deltaOrder[0]);
          } else {
            asks = asks.filter((ask) => ask[0] !== deltaOrder[0]);
            asks.push(deltaOrder);
          }
        });
      }
      bids.sort((a, b) => b[0] - a[0]); // Ascending order
      asks.sort((a, b) => a[0] - b[0]); // Descending order

      setFeedData({ bids, asks });
      setSocket(ws);
    };

    return () => {
      ws.close();
    };
  }, []);

  let groupBids = groupingPrice(feedData.bids, gap);
  let groupAsks = groupingPrice(feedData.asks, gap);

  // Adding total size value
  let totalBid = 0;
  groupBids.forEach((bid) => {
    totalBid += bid[1];
    bid[2] = totalBid;
  });
  let totalAsk = 0;
  groupAsks.forEach((ask) => {
    totalAsk += ask[1];
    ask[2] = totalAsk;
  });

  function toggleFeed() {
    const message = {
      event: "unsubscribe",
      feed: "book_ui_1",
      product_ids: coinOption[coin].message.product_ids,
    };

    socket?.send(JSON.stringify(message));
    socket?.send(
      JSON.stringify(coinOption[coin === "XBT" ? "ETH" : "XBT"].message)
    );

    setCoin((prevCoin) => (prevCoin === "XBT" ? "ETH" : "XBT"));
  }

  return (
    <div>
      <div className="flex justify-around p-5">
        <select
          className="bg-slate-800 p-2 rounded-sm"
          onChange={(e) => setGap(parseFloat(e.target.value))}
        >
          {coinOption[coin].gap.map((num) => (
            <option value={num} key={num}>
              Group {num.toFixed(2)}
            </option>
          ))}
        </select>
        <button className="p-2 bg-purple-800 rounded-lg" onClick={toggleFeed}>
          Toggle Feed
        </button>
      </div>
      <div className="flex items-start">
        <table className="h-fit">
          <thead>
            <tr>
              <th className="w-[150px] text-right">Total Bid</th>
              <th className="w-[150px] text-right">Bid Size</th>
              <th className="w-[150px] text-right">Bid Price</th>
            </tr>
          </thead>
          <tbody>
            {groupBids.map((bid) => {
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
            {groupAsks.map((ask) => {
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
    </div>
  );
}

function groupingPrice(orders: Order[], gap: number) {
  // Only work if orders has been sorted
  let newOrders: Order[] = [];
  orders.forEach((order) => {
    let priceDiff = order[0] % gap;
    if (
      newOrders[newOrders.length - 1] &&
      newOrders[newOrders.length - 1][0] === order[0] - priceDiff
    ) {
      newOrders[newOrders.length - 1][1] += order[1];
    } else {
      newOrders.push([order[0] - priceDiff, order[1]]);
    }
  });
  return newOrders;
}
