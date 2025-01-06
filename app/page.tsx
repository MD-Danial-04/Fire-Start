'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase'
import type { FirestartBa } from '@/types'

export default function Home() {
  const [serialNumber, setSerialNumber] = useState('')
  const [baRecords, setBaRecords] = useState<FirestartBa[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchBaRecords()

    const channel = supabase
      .channel('firestart_ba-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'firestart_ba'
        },
        (payload) => {
          console.log('Change received!', payload)
          fetchBaRecords()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchBaRecords = async () => {
    const { data, error } = await supabase
      .from('firestart_ba')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching records:', error)
      return
    }

    setBaRecords(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const { error } = await supabase
      .from('firestart_ba')
      .insert([{ serial_number: serialNumber }])

    if (error) {
      console.error('Error inserting record:', error)
      alert('Error submitting data')
    } else {
      setSerialNumber('')
    }

    setIsLoading(false)
  }

  return (
    <div className="grid grid-rows-[auto_1fr] gap-8 min-h-screen p-8 pb-20 sm:p-20">
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto w-full">
        <input
          type="text"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          placeholder="Enter Serial Number"
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      {/* Records Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">BA ID</th>
              <th className="border p-2 text-left">Serial Number</th>
              <th className="border p-2 text-left">Created At</th>
            </tr>
          </thead>
          <tbody>
            {baRecords.map((record) => (
              <tr key={record.ba_id} className="hover:bg-gray-50">
                <td className="border p-2">{record.ba_id}</td>
                <td className="border p-2">{record.serial_number}</td>
                <td className="border p-2">
                  {new Date(record.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
