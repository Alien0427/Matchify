import { useState } from 'react';

export function Tabs({ children, defaultIndex = 0, className = '' }) {
  const [index, setIndex] = useState(defaultIndex);
  const tabs = Array.isArray(children) ? children : [children];

  return (
    <div className={`${className}`}>
      <div className="flex gap-2 mb-6">
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
              index === i
                ? 'bg-primary text-white shadow'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            {t.props.title}
          </button>
        ))}
      </div>
      <div>{tabs[index]}</div>
    </div>
  );
}

export function Tab({ title, children }) {
  return (
    <>
      {children}
    </>
  );
}