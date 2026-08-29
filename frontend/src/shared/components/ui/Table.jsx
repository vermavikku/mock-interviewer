import React from 'react';
import { cn } from '../../utils/cn';
import './Table.css';

export function Table({ columns, data, onRowClick, emptyMessage = 'No data available', className = '' }) {
  return (
    <div className={cn('ui-table-container', className)}>
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={col.key || idx} style={{ width: col.width, textAlign: col.align || 'left' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="ui-table-empty">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={cn(onRowClick && 'clickable-row')}
              >
                {columns.map((col, colIdx) => (
                  <td key={col.key || colIdx} style={{ textAlign: col.align || 'left' }}>
                    {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
