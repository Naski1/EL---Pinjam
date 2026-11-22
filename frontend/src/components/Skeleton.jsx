import React from 'react';

/**
 * Reusable Skeleton Loading Components
 * Usage:
 *   <Skeleton className="w-32 h-4" />  - Basic line
 *   <Skeleton.Circle className="w-12 h-12" /> - Avatar/Circle
 *   <Skeleton.Card /> - Card placeholder
 *   <Skeleton.Table rows={5} cols={4} /> - Table placeholder
 */

// Base Skeleton Element
export const Skeleton = ({ className = '', ...props }) => (
    <div
        className={`animate-pulse bg-slate-200/70 dark:bg-slate-700/50 rounded ${className}`}
        {...props}
    />
);

// Circle Skeleton (for avatars, icons)
Skeleton.Circle = ({ className = '', ...props }) => (
    <div
        className={`animate-pulse bg-slate-200/70 dark:bg-slate-700/50 rounded-full ${className}`}
        {...props}
    />
);

// Text Line Skeleton
Skeleton.Text = ({ lines = 1, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <div
                key={i}
                className={`animate-pulse bg-slate-200/70 dark:bg-slate-700/50 rounded h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
            />
        ))}
    </div>
);

// Card Skeleton
Skeleton.Card = ({ className = '' }) => (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 ${className}`}>
        <div className="flex justify-between items-start mb-4">
            <Skeleton.Circle className="w-12 h-12" />
            <Skeleton className="w-12 h-5 rounded-md" />
        </div>
        <Skeleton className="w-20 h-3 mb-2" />
        <Skeleton className="w-16 h-8" />
    </div>
);

// Table Skeleton
Skeleton.Table = ({ rows = 5, cols = 4, className = '' }) => (
    <div className={`overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 ${className}`}>
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800/30 px-6 py-4 flex gap-4">
            {Array.from({ length: cols }).map((_, i) => (
                <Skeleton key={i} className="flex-1 h-4" />
            ))}
        </div>
        {/* Rows */}
        <div className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} className="px-6 py-4 flex gap-4 items-center">
                    {Array.from({ length: cols }).map((_, colIdx) => (
                        <Skeleton
                            key={colIdx}
                            className={`h-4 ${colIdx === 0 ? 'w-8' : 'flex-1'}`}
                        />
                    ))}
                </div>
            ))}
        </div>
    </div>
);

// Stats Grid Skeleton (4 cards)
Skeleton.StatsGrid = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton.Card key={i} />
        ))}
    </div>
);

// Chart Skeleton
Skeleton.Chart = ({ className = '' }) => (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 ${className}`}>
        <div className="flex justify-between items-center mb-8">
            <div>
                <Skeleton className="w-40 h-5 mb-2" />
                <Skeleton className="w-24 h-3" />
            </div>
            <Skeleton.Circle className="w-8 h-8" />
        </div>
        <div className="flex items-end justify-between h-48 gap-3 px-4">
            {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton
                    key={i}
                    className="flex-1 rounded-t-lg"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                />
            ))}
        </div>
    </div>
);

// List Item Skeleton
Skeleton.ListItem = ({ hasAvatar = true, className = '' }) => (
    <div className={`flex items-center gap-4 py-4 ${className}`}>
        {hasAvatar && <Skeleton.Circle className="w-10 h-10 shrink-0" />}
        <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
    </div>
);

// Page Header Skeleton
Skeleton.PageHeader = () => (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
            <Skeleton className="w-48 h-9 mb-2" />
            <Skeleton className="w-32 h-4" />
        </div>
        <div className="flex gap-3">
            <Skeleton className="w-32 h-11 rounded-xl" />
            <Skeleton className="w-11 h-11 rounded-xl" />
        </div>
    </div>
);

// Full Page Loading Skeleton
Skeleton.PageLoading = () => (
    <div className="animate-fade-in">
        <Skeleton.PageHeader />
        <Skeleton.StatsGrid />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton.Chart />
            <Skeleton.Chart />
        </div>
    </div>
);

// Book/Item Grid Skeleton
Skeleton.GridItems = ({ count = 6 }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5">
                <Skeleton className="w-full h-40 rounded-xl mb-4" />
                <Skeleton className="w-3/4 h-5 mb-2" />
                <Skeleton className="w-1/2 h-4 mb-4" />
                <div className="flex justify-between">
                    <Skeleton className="w-16 h-6 rounded-full" />
                    <Skeleton className="w-20 h-8 rounded-lg" />
                </div>
            </div>
        ))}
    </div>
);

export default Skeleton;
