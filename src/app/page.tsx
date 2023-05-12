"use client";

import { useState } from "react";
import OrderBook from "./OrderBook";

export default function Home() {
  const [isOrderbookOpen, setIsOrderbookOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-24">
      <div className="uppercase font-bold text-[3rem] leading-none">
        OrderBook
      </div>
      <button
        className="rounded-lg bg-pink-700 px-3 py-2 my-10"
        onClick={() => setIsOrderbookOpen(!isOrderbookOpen)}
      >
        Toggle Orderbook
      </button>
      {isOrderbookOpen && <OrderBook />}
    </main>
  );
}
