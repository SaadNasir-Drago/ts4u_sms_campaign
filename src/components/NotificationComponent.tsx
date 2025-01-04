// components/NotificationComponent.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import io from 'socket.io-client'

interface NotificationMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
}

export default function NotificationComponent() {
    const [notifications, setNotifications] = useState<NotificationMessage[]>([])
    const [isConnected, setIsConnected] = useState(false)

    const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        const newNotification: NotificationMessage = {
            id: Date.now().toString(),
            message,
            type,
            timestamp: new Date(),
        }
        setNotifications(prev => [...prev, newNotification])

        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotification.id))
        }, 5000)
    }, [])

    useEffect(() => {
        const initSocket = async () => {
            try {
                // Initialize socket server
                await fetch('/api/socket')
                
                // Connect to socket server
                const socket = io('http://localhost:3001', {
                    path: '/api/socket/io',
                    addTrailingSlash: false,
                })

                socket.on('connect', () => {
                    console.log('Socket Connected:', socket.id)
                    setIsConnected(true)
                    addNotification('Connected to notification service', 'success')
                })

                socket.on('disconnect', () => {
                    console.log('Socket Disconnected')
                    setIsConnected(false)
                    addNotification('Disconnected from notification service', 'error')
                })

                socket.on('connect_error', (error) => {
                    console.error('Socket connection error:', error)
                    addNotification('Failed to connect to notification service', 'error')
                })

                socket.on('campaignScheduled', (data) => {
                    addNotification(`Campaign "${data.name}" has been scheduled`, 'info')
                })

                socket.on('campaignSent', (data) => {
                    addNotification(`Campaign "${data.name}" has been sent successfully`, 'success')
                })

                socket.on('campaignFailed', (data) => {
                    addNotification(`Campaign "${data.name}" has failed`, 'error')
                })

                return () => {
                    socket.disconnect()
                }
            } catch (error) {
                console.error('Socket initialization error:', error)
                addNotification('Failed to initialize socket connection', 'error')
            }
        }

        initSocket()
    }, [addNotification])

    return (
        <div className="fixed top-4 right-4 w-96 space-y-2 z-50">
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`p-4 rounded-lg shadow-lg transition-all duration-300 ${
                        notification.type === 'success' ? 'bg-green-500' :
                        notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                    } text-white`}
                >
                    <div className="flex justify-between items-start">
                        <p>{notification.message}</p>
                        <button
                            onClick={() => setNotifications(prev => 
                                prev.filter(n => n.id !== notification.id)
                            )}
                            className="ml-4 text-white hover:text-gray-200"
                        >
                            ×
                        </button>
                    </div>
                    <div className="text-xs mt-1 text-white/80">
                        {notification.timestamp.toLocaleTimeString()}
                    </div>
                </div>
            ))}
            {!isConnected && (
                <div className="p-4 rounded-lg shadow-lg bg-yellow-500 text-white">
                    Attempting to reconnect...
                </div>
            )}
        </div>
    )
}