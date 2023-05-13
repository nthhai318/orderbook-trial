"use client";

import { useEffect, useState } from "react";

// Order represent value in order: price , size, total(optional)
type Order = number[];

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

    // Initial subscribe to data feed
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
      bids.sort((a, b) => b[0] - a[0]); // Descending order
      asks.sort((a, b) => a[0] - b[0]); // Ascending order

      setFeedData({ bids, asks });
      setSocket(ws);
    };

    return () => {
      ws.close();
    };
  }, []);

  const groupBids = groupingPrice(feedData.bids, gap).slice(0, 13);
  const groupAsks = groupingPrice(feedData.asks, gap).slice(0, 13);

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
    //Unsubscribe from current coin and subscribe to new Coin
    const message = {
      event: "unsubscribe",
      feed: coinOption[coin].message.feed,
      product_ids: coinOption[coin].message.product_ids,
    };

    socket?.send(JSON.stringify(message));
    socket?.send(
      JSON.stringify(coinOption[coin === "XBT" ? "ETH" : "XBT"].message)
    );

    setCoin((prevCoin) => (prevCoin === "XBT" ? "ETH" : "XBT"));
  }

  return (
    <div className="rounded-sm bg-slate-900 p-2 h-[460px]">
      <div className="flex justify-around p-5">
        <select
          className="bg-slate-800 p-2 rounded-lg"
          onChange={(e) => setGap(parseFloat(e.target.value))}
        >
          {coinOption[coin].gap.map((num) => (
            <option value={num} key={num}>
              Group {num.toFixed(2)}
            </option>
          ))}
        </select>
        <button className="p-2 bg-purple-800 rounded-lg" onClick={toggleFeed}>
          {coin} / USD
        </button>
      </div>
      <div className="grid grid-cols-2">
        <table className="h-fit table-fixed w-full">
          <thead>
            <tr>
              <div></div>
              <th className="text-right whitespace-nowrap">Total Bid</th>
              <th className="text-right whitespace-nowrap">Bid Size</th>
              <th className="text-right whitespace-nowrap">Bid Price</th>
            </tr>
          </thead>
          <tbody>
            {groupBids.map((bid) => {
              return (
                <tr key={bid[0]} className="relative z-10">
                  <div
                    style={{ width: `${(bid[2] / totalBid) * 100}%` }}
                    className="absolute h-full top-0 right-0 bottom-0 bg-red-900 w-full z-[-1]"
                  ></div>
                  <td className=" text-right">{bid[2]!.toLocaleString()}</td>
                  <td className=" text-right">{bid[1].toLocaleString()}</td>
                  <td className=" text-right">
                    {bid[0].toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <table className="h-fit table-fixed w-full">
          <thead>
            <tr>
              <th className=" text-right whitespace-nowrap">Ask Price</th>
              <th className=" text-right whitespace-nowrap">Ask Size</th>
              <th className=" text-right whitespace-nowrap">Total Ask</th>
              <div></div>
            </tr>
          </thead>
          <tbody>
            {groupAsks.map((ask) => {
              return (
                <tr key={ask[0]} className="relative z-10">
                  <td className=" text-right">
                    {ask[0].toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className=" text-right">{ask[1].toLocaleString()}</td>
                  <td className=" text-right">{ask[2]!.toLocaleString()}</td>
                  <div
                    style={{ width: `${(ask[2] / totalAsk) * 100}%` }}
                    className="absolute h-full top-0 left-0 bottom-0 bg-green-900 w-full z-[-1]"
                  ></div>
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
