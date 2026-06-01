'use client'
import { useState, useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export default function CompMap() {
  const mapContainer = useRef<any>(null)
  const map = useRef<any>(null)
  const [lng, setLng] = useState(-84.39)
  const [lat, setLat] = useState(33.75)
  const [zoom, setZoom] = useState(10)
  const [comps, setComps] = useState<any[]>([])
  const [filters, setFilters] = useState({ dqi: 0, zipcode: '', offMarket: false })
  const [selectedDeal, setSelectedDeal] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (map.current) return
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [lng, lat],
      zoom: zoom,
      pitch: 45,
      bearing: -17.6,
      antialias: true
    })

    map.current.on('load', () => {
      map.current.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-opacity': 0.6
        }
      })
    })

    fetchComps()
  }, [])

  const fetchComps = async () => {
    const { data } = await supabase.rpc('get_vaultforge_comps', {
      p_zipcode: filters.zipcode || '30103',
      p_beds: 3,
      p_sqft: 1500
    })
    
    if (data?.comps) {
      setComps(data.comps)
      data.comps.forEach((deal: any) => addMarker(deal))
    }
  }

  const addMarker = (deal: any) => {
    const el = document.createElement('div')
    el.className = 'marker'
    el.style.background = deal.intel_status === 'PASS' ? '#4ade80' : '#facc15'
    el.style.width = '20px'
    el.style.height = '20px'
    el.style.borderRadius = '50%'
    el.style.border = '2px solid #000'
    el.style.cursor = 'pointer'
    el.style.boxShadow = '0 0 10px rgba(74, 222, 128, 0.8)'

    if (deal.source === 'PAIN') {
      el.style.background = '#a855f7'
      el.style.boxShadow = '0 0 10px rgba(168, 85, 247, 0.8)'
    }

    el.addEventListener('click', () => setSelectedDeal(deal))

    // Geocode address - in production use stored lat/lng
    new mapboxgl.Marker(el)
      .setLngLat([lng + (Math.random() - 0.5) * 0.1, lat + (Math.random() - 0.5) * 0.1])
      .addTo(map.current)
  }

  return (
    <div style={{ height: '100vh', background: '#000', color: '#f8f8f8' }}>
      
      {/* SEARCH BAR */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        right: '16px',
        zIndex: 10,
        background: '#111',
        border: '1px solid #333',
        padding: '12px',
        display: 'flex',
        gap: '8px'
      }}>
        <input 
          placeholder="SEARCH: 30103 DQI > 90 OFF-MARKET"
          value={filters.zipcode}
          onChange={(e) => setFilters({...filters, zipcode: e.target.value})}
          style={{
            flex: 1,
            background: '#000',
            border: '1px solid #333',
            color: '#f8f8f8',
            padding: '8px',
            fontSize: '11px',
            fontFamily: 'monospace'
          }}
        />
        <button onClick={fetchComps} style={{
          background: '#f8f8f8',
          color: '#000',
          border: 'none',
          padding: '8px 16px',
          fontSize: '11px',
          fontWeight: '700',
          cursor: 'pointer'
        }}>
          SEARCH
        </button>
        <button onClick={() => map.current.flyTo({ pitch: 60, bearing: 0 })} style={{
          background: '#333',
          color: '#f8f8f8',
          border: '1px solid #555',
          padding: '8px 16px',
          fontSize: '11px',
          cursor: 'pointer'
        }}>
          3D
        </button>
      </div>

      {/* MAP */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* DEAL CARD */}
      {selectedDeal && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '16px',
          width: '400px',
          background: '#111',
          border: '1px solid #333',
          padding: '16px',
          zIndex: 10
        }}>
          <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>
            {selectedDeal.address}
          </div>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '12px' }}>
            DQI {selectedDeal.dqi_score} // {selectedDeal.intel_status} // {selectedDeal.source}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10px', marginBottom: '12px' }}>
            <div>ASK: ${selectedDeal.asking_price?.toLocaleString()}</div>
            <div>ARV: ${selectedDeal.arv?.toLocaleString()}</div>
            <div>SPREAD: {Math.round(((selectedDeal.arv - selectedDeal.asking_price) / selectedDeal.arv) * 100)}%</div>
            <div>REHAB: {selectedDeal.rehab_level}</div>
          </div>
          <button style={{
            width: '100%',
            background: '#f8f8f8',
            color: '#000',
            border: 'none',
            padding: '12px',
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'pointer'
          }}>
            MESSAGE OWNER
          </button>
        </div>
      )}

      {/* LEGEND */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        background: '#111',
        border: '1px solid #333',
        padding: '12px',
        fontSize: '10px',
        zIndex: 10
      }}>
        <div style={{ marginBottom: '4px' }}><span style={{ color: '#4ade80' }}>●</span> PASS</div>
        <div style={{ marginBottom: '4px' }}><span style={{ color: '#facc15' }}>●</span> REVIEW</div>
        <div style={{ marginBottom: '4px' }}><span style={{ color: '#a855f7' }}>●</span> OFF-MARKET</div>
        <div><span style={{ color: '#f87171' }}>●</span> DISLOCATION</div>
      </div>
    </div>
  )
}
