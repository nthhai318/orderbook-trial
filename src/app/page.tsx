"use client";

import { useEffect, useState } from "react";

const message = {
  event: "subscribe",
  feed: "book_ui_1",
  product_ids: ["PI_XBTUSD"],
};

export default function Home() {
  const [isOrderbookOpen, setIsOrderbookOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-around p-24">
      <div className="uppercase font-bold text-[3rem]">OrderBook</div>
      <button
        className="rounded-lg bg-pink-700 px-3 py-2"
        onClick={() => setIsOrderbookOpen(!isOrderbookOpen)}
      >
        Toggle Orderbook
      </button>
      {isOrderbookOpen && <OrderBook />}
    </main>
  );
}

function OrderBook() {
  useEffect(() => {
    const ws = new WebSocket("wss://www.cryptofacilities.com/ws/v1");

    ws.onopen = () => {
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(data);
    };

    return () => {
      ws.close();
    };
  }, []);
  return <div>Orderbook Data</div>;
}
