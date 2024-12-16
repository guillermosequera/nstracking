import React, { createContext, useContext, useState } from 'react'

const TabsContext = createContext()

export function Tabs({ value, onValueChange, children, className = '' }) {
  const [activeTab, setActiveTab] = useState(value)

  const handleTabChange = (newValue) => {
    setActiveTab(newValue)
    if (onValueChange) {
      onValueChange(newValue)
    }
  }

  return (
    <TabsContext.Provider value={{ activeTab, handleTabChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className = '' }) {
  const { activeTab, handleTabChange } = useContext(TabsContext)
  
  return (
    <button
      type="button"
      onClick={() => handleTabChange(value)}
      className={`px-4 py-2 rounded-md transition-colors
        ${activeTab === value 
          ? 'bg-blue-800 text-white' 
          : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}
        ${className}`}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className = '' }) {
  const { activeTab } = useContext(TabsContext)
  
  if (value !== activeTab) return null
  
  return (
    <div className={className}>
      {children}
    </div>
  )
} 