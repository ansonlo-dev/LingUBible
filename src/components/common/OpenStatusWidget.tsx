import { useState, useEffect } from 'react';
import { getStatus } from "@openstatus/react";

interface OpenStatusWidgetProps {
  slug: string;
  href?: string;
  className?: string;
}

type Status = "unknown" | "operational" | "degraded_performance" | "partial_outage" | "major_outage" | "under_maintenance" | "incident";

export function OpenStatusWidget({ slug, href, className = '' }: OpenStatusWidgetProps) {
  const [status, setStatus] = useState<Status>('unknown');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await getStatus(slug);
        setStatus(response.status);
      } catch (error) {
        console.warn('Failed to fetch OpenStatus:', error);
        setStatus('unknown');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
    // 每5分鐘更新一次狀態
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [slug]);

  const getStatusConfig = (status: Status) => {
    switch (status) {
      case 'operational':
        return {
          text: 'Operational',
          bgColor: 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-400',
          dotColor: 'bg-green-500',
          hoverColor: 'hover:bg-green-200 dark:hover:bg-green-900/30',
        };
      case 'degraded_performance':
        return {
          text: 'Degraded',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-800 dark:text-yellow-400',
          dotColor: 'bg-yellow-500',
          hoverColor: 'hover:bg-yellow-200 dark:hover:bg-yellow-900/30',
        };
      case 'partial_outage':
      case 'major_outage':
        return {
          text: 'Down',
          bgColor: 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-400',
          dotColor: 'bg-red-500',
          hoverColor: 'hover:bg-red-200 dark:hover:bg-red-900/30',
        };
      case 'under_maintenance':
        return {
          text: 'Maintenance',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-800 dark:text-blue-400',
          dotColor: 'bg-blue-500',
          hoverColor: 'hover:bg-blue-200 dark:hover:bg-blue-900/30',
        };
      case 'incident':
        return {
          text: 'Incident',
          bgColor: 'bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800',
          textColor: 'text-orange-800 dark:text-orange-400',
          dotColor: 'bg-orange-500',
          hoverColor: 'hover:bg-orange-200 dark:hover:bg-orange-900/30',
        };
      case 'unknown':
      default:
        return {
          text: loading ? 'Checking' : 'Unknown',
          bgColor: 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
          textColor: 'text-gray-600 dark:text-gray-400',
          dotColor: 'bg-gray-400',
          hoverColor: 'hover:bg-gray-200 dark:hover:bg-gray-700',
        };
    }
  };

  const config = getStatusConfig(status);
  const targetHref = href || `https://${slug}.openstatus.dev`;

  return (
    <a
      href={targetHref}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 ${config.bgColor} ${config.textColor} ${config.hoverColor} ${className}`}
      title={`Service Status: ${config.text} - Powered by OpenStatus`}
    >
      <div 
        className={`w-2 h-2 rounded-full ${config.dotColor} ${loading ? 'animate-pulse' : ''}`} 
      />
      <span>{config.text}</span>
      {status === 'operational' && !loading && (
        <svg 
          className="w-3 h-3 opacity-60" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
            clipRule="evenodd" 
          />
        </svg>
      )}
    </a>
  );
} 