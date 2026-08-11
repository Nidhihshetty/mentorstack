"use client";

import { X, Calendar, CalendarIcon, Users, MessageSquare, FileText, BookOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'users' | 'questions' | 'articles' | 'communities';
  data: any;
  stats: any;
}

interface TimelineDataItem {
  date: string;
  count: number;
  items: any[];
}

export default function AdvancedAnalyticsModal({ isOpen, onClose, type, data, stats }: AnalyticsModalProps) {
  // Date range state
  const [dateRange, setDateRange] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({ startDate: null, endDate: null });
  const [isSelectingStart, setIsSelectingStart] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getConfig = () => {
    switch (type) {
      case 'users':
        return {
          title: 'User Registration Timeline',
          color: 'teal',
          dateField: 'createdAt',
          label: 'Users Joined',
          icon: Users,
          subtitle: 'Manage and moderate all platform users'
        };
      case 'questions':
        return {
          title: 'Questions Posted Timeline',
          color: 'teal',
          dateField: 'createdAt',
          label: 'Questions Posted',
          icon: MessageSquare,
          subtitle: 'Manage and moderate all platform questions'
        };
      case 'articles':
        return {
          title: 'Articles Published Timeline',
          color: 'teal',
          dateField: 'createdAt',
          label: 'Articles Published',
          icon: FileText,
          subtitle: 'Manage and moderate all platform articles'
        };
      case 'communities':
        return {
          title: 'Communities Created Timeline',
          color: 'teal',
          dateField: 'createdAt',
          label: 'Communities Created',
          icon: BookOpen,
          subtitle: 'Manage and moderate all platform communities'
        };
    }
  };

  const config = getConfig();

  // Process data to create timeline
  const timelineData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    // Group by date
    const grouped = data.reduce((acc: Record<string, TimelineDataItem>, item: any) => {
      const date = item[config.dateField];
      if (!date) return acc;
      
      // Parse the date string and extract date in UTC to avoid timezone issues
      const dateStr = String(date);
      let dateKey: string;
      
      if (dateStr.includes('T')) {
        // ISO format: extract just the date part before 'T'
        dateKey = dateStr.split('T')[0];
      } else {
        // Already in YYYY-MM-DD format
        dateKey = dateStr;
      }
      
      // Filter by date range if set
      if (dateRange.startDate && dateKey < dateRange.startDate) return acc;
      if (dateRange.endDate && dateKey > dateRange.endDate) return acc;
      
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          count: 0,
          items: []
        };
      }
      acc[dateKey].count += 1;
      acc[dateKey].items.push(item);
      return acc;
    }, {});

    // Convert to array and sort by date
    return Object.values(grouped)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data, config.dateField, dateRange]);

  // Get max count for scaling
  const maxCount = useMemo(() => {
    return Math.max(...timelineData.map((d) => d.count), 1);
  }, [timelineData]);

  const getColorClasses = (color: string) => {
    const colors = {
      teal: {
        bg: 'from-teal-500 to-emerald-600',
        bar: 'bg-teal-500',
        light: 'bg-teal-100',
        text: 'text-teal-600',
        border: 'border-teal-500',
        hex: '#14b8a6',
        headerBg: '#14b8a6'
      },
      blue: {
        bg: 'from-blue-500 to-indigo-600',
        bar: 'bg-blue-500',
        light: 'bg-blue-100',
        text: 'text-blue-600',
        border: 'border-blue-500',
        hex: '#3b82f6',
        headerBg: '#3b82f6'
      },
      purple: {
        bg: 'from-purple-500 to-pink-600',
        bar: 'bg-purple-500',
        light: 'bg-purple-100',
        text: 'text-purple-600',
        border: 'border-purple-500',
        hex: '#a855f7',
        headerBg: '#a855f7'
      },
      orange: {
        bg: 'from-orange-500 to-red-600',
        bar: 'bg-orange-500',
        light: 'bg-orange-100',
        text: 'text-orange-600',
        border: 'border-orange-500',
        hex: '#f97316',
        headerBg: '#f97316'
      }
    };
    return colors[color as keyof typeof colors];
  };

  const colorClasses = getColorClasses(config.color);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format date for chart X-axis
  const formatChartDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calendar helper functions
  const generateCalendar = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty slots for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  
  const calendarDays = generateCalendar(
    currentCalendarMonth.getFullYear(),
    currentCalendarMonth.getMonth()
  );

  const handleDateSelect = (date: Date) => {
    // Use local date string to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    if (isSelectingStart) {
      setDateRange({ startDate: dateStr, endDate: dateRange.endDate });
      setIsSelectingStart(false);
    } else {
      // If end date is before start date, swap them
      if (dateRange.startDate && dateStr < dateRange.startDate) {
        setDateRange({ startDate: dateStr, endDate: dateRange.startDate });
      } else {
        setDateRange({ startDate: dateRange.startDate, endDate: dateStr });
      }
      setShowCalendar(false);
      setIsSelectingStart(true);
    }
  };

  const clearDateRange = () => {
    setDateRange({ startDate: null, endDate: null });
    setIsSelectingStart(true);
  };

  const isDateInRange = (date: Date) => {
    if (!dateRange.startDate || !dateRange.endDate) return false;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return dateStr >= dateRange.startDate && dateStr <= dateRange.endDate;
  };

  const isDateSelected = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return dateStr === dateRange.startDate || dateStr === dateRange.endDate;
  };

  // Calculate stats
  const totalCount = data?.length || 0;
  const avgPerDay = timelineData.length > 0 ? (totalCount / timelineData.length).toFixed(1) : '0';
  const peakDay = timelineData.reduce<TimelineDataItem | null>((max, curr) => 
    curr.count > (max?.count || 0) ? curr : max
  , null);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-4 md:inset-8 lg:inset-12 xl:inset-16 flex items-center justify-center">
        <div className="relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="relative text-white px-8 py-6" style={{ backgroundColor: colorClasses.headerBg }}>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white/25 flex items-center justify-center">
                  {config.icon && <config.icon className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{config.title}</h2>
                  <p className="text-white/80 text-sm mt-0.5">{config.subtitle}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="bg-white/25 rounded-2xl px-6 py-3 text-center">
                  <div className="text-xs font-medium opacity-90">Total</div>
                  <div className="text-4xl font-bold mt-1">{totalCount}</div>
                </div>
                
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-lg bg-white/25 hover:bg-white/35 transition flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Chart Content */}
          <div className="flex-1 overflow-auto p-8 bg-gray-50">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              
              {/* Date Range Selector */}
              <div className="mb-6">
                <div className="flex items-center gap-4 flex-wrap">
                  <h3 className="text-lg font-bold text-gray-900">{config.label} Over Time</h3>
                  
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => setShowCalendar(!showCalendar)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${
                        showCalendar ? `${colorClasses.border} ${colorClasses.text} bg-white` : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      } transition font-semibold`}
                    >
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        {dateRange.startDate && dateRange.endDate
                          ? `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`
                          : 'Select Date Range'}
                      </span>
                    </button>
                    
                    {(dateRange.startDate || dateRange.endDate) && (
                      <button
                        onClick={clearDateRange}
                        className="px-3 py-2 rounded-lg border-2 border-red-300 text-red-600 hover:border-red-400 transition font-semibold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Calendar Picker */}
                {showCalendar && (
                  <div className="mt-4 p-4 border-2 border-gray-200 rounded-xl bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1))}
                        className="px-3 py-1 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 font-semibold"
                      >
                        ←
                      </button>
                      <div className="font-bold text-gray-900">
                        {currentCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                      <button
                        onClick={() => setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1))}
                        className="px-3 py-1 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 font-semibold"
                      >
                        →
                      </button>
                    </div>

                    <div className="text-center text-sm text-gray-600 mb-2">
                      {isSelectingStart ? 'Select Start Date' : 'Select End Date'}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                          {day}
                        </div>
                      ))}
                      
                      {calendarDays.map((date, idx) => {
                        if (!date) {
                          return <div key={`empty-${idx}`} />;
                        }
                        
                        const isSelected = isDateSelected(date);
                        const isInRange = isDateInRange(date);
                        const isToday = date.toDateString() === new Date().toDateString();
                        
                        return (
                          <button
                            key={idx}
                            onClick={() => handleDateSelect(date)}
                            className={`
                              py-2 rounded-lg text-sm font-semibold transition
                              ${isSelected ? `${colorClasses.bar} text-white` : ''}
                              ${isInRange && !isSelected ? `${colorClasses.light} ${colorClasses.text}` : ''}
                              ${!isSelected && !isInRange ? 'hover:bg-gray-200 text-gray-700' : ''}
                              ${isToday && !isSelected ? 'border-2 border-blue-500' : ''}
                            `}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {timelineData.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-semibold">No data available for selected date range</p>
                </div>
              ) : (
                <>
                  {/* Line Chart */}
                  <div className="h-96 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatChartDate}
                          stroke="#6b7280"
                          style={{ fontSize: '12px', fontWeight: '600' }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          style={{ fontSize: '12px', fontWeight: '600' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '2px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          labelFormatter={(value) => formatDate(value)}
                          formatter={(value: any) => [value, config.label]}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: '14px', fontWeight: '600' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke={colorClasses.hex}
                          strokeWidth={3}
                          dot={{ fill: colorClasses.hex, r: 4 }}
                          activeDot={{ r: 6 }}
                          name={config.label}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Summary Stats */}
                  <div className="pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-4 rounded-xl ${colorClasses.light}`}>
                        <div className="text-sm font-semibold text-gray-600 mb-1">Date Range</div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatDate(timelineData[0].date)} - {formatDate(timelineData[timelineData.length - 1].date)}
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl ${colorClasses.light}`}>
                        <div className="text-sm font-semibold text-gray-600 mb-1">Most Active Day</div>
                        <div className="text-lg font-bold text-gray-900">
                          {peakDay ? formatDate(peakDay.date) : 'N/A'}
                        </div>
                      </div>
                      <div className={`p-4 rounded-xl ${colorClasses.light}`}>
                        <div className="text-sm font-semibold text-gray-600 mb-1">Total Days</div>
                        <div className="text-lg font-bold text-gray-900">
                          {timelineData.length}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
