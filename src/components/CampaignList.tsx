'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import io from 'socket.io-client'

interface Campaign {
  _id: string
  name: string
  type: string
  status: string
  scheduleTime: string
}

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isConnected, setIsConnected] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchCampaigns()

    // Initialize socket connection
    const initSocket = async () => {
      try {
        await fetch('/api/socket')
        const socket = io('http://localhost:3001', {
          path: '/api/socket/io',
          addTrailingSlash: false,
        })

        socket.on('connect', () => {
          console.log('Socket Connected:', socket.id)
          setIsConnected(true)
        })

        socket.on('disconnect', () => {
          console.log('Socket Disconnected')
          setIsConnected(false)
        })

        // Listen for 'campaignScheduled' event
        socket.on('campaignScheduled', (data) => {
          console.log('Real-time update:', data)
          fetchCampaigns() // Refresh list
        })

        return () => {
          socket.disconnect()
        }
      } catch (error) {
        console.error('Socket initialization error:', error)
      }
    }

    initSocket()
  }, [page])

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`/api/campaigns?page=${page}&limit=10`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns)
        setTotalPages(data.totalPages)
      } else {
        // throw new Error('Failed to fetch campaigns')
        alert('Failed to fetch campaigns')

      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      alert('Failed to fetch campaigns')
    }
  }

  return (
    <div>
      <div className="mb-4">
        <span
          className={`px-2 py-1 rounded ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          } text-white`}
        >
          {isConnected ? 'Connected to live updates' : 'Disconnected from live updates'}
        </span>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2">Name</th>
            <th className="border p-2">Type</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Schedule Time</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr key={campaign._id}>
              <td className="border p-2">{campaign.name}</td>
              <td className="border p-2">{campaign.type}</td>
              <td className="border p-2">{campaign.status}</td>
              <td className="border p-2">{new Date(campaign.scheduleTime).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-between">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          Previous
        </button>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          Next
        </button>
      </div>
    </div>
  )
}
