'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Deal = {
  id: string;
  title?: string;
  state?: string;
  property_type?: string;
  price?: number;
  description?: string;
  photo_urls?: string[];
};

function getEmail() {
  if (typeof window === 'undefined') return '';
  return (
    window.localStorage.getItem('vf_email') ||
    window.sessionStorage.getItem('vf_email') ||
    ''
  );
}

export default function BuyBucketPage() {
  const [deals, setDeals] = useState<Deal[]>([]);

  async function load() {
    const res = await fetch('/api/deal/buy-bucket/list', {
      headers: { 'x-vf-email': getEmail() },
    });
    const data = await res.json();
    setDeals(data.deals || []);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main style={{ padding: 20, color: 'white' }}>
      <h1>Buy Bucket</h1>

      {deals.map((deal) => {
        const image =
          deal.photo_urls && deal.photo_urls.length > 0
            ? deal.photo_urls[0]
            : null;

        return (
          <div key={deal.id} style={{ marginBottom: 30 }}>
            {image && (
              <img
                src={image}
                style={{
                  width: '100%',
                  height: 200,
                  objectFit: 'cover',
                  borderRadius: 10,
                }}
              />
            )}

            <h2>{deal.title}</h2>
            <p>
              {deal.state} • {deal.property_type}
            </p>
            <p>${deal.price || 'No price'}</p>
            <p>{deal.description}</p>

            <Link href={`/deal/${deal.id}`}>
              <button>Open Deal Room</button>
            </Link>
          </div>
        );
      })}
    </main>
  );
}
