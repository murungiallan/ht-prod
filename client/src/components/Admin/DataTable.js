import { useState, useMemo } from "react";

const DataTable = ({ columns, data, totalCount, onEdit, onDelete, onSelect, selectedRows, setSelectedRows, onSort, sortConfig, fetchPage }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const pageSizeOptions = [10, 25, 50];

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchPage(newPage, itemsPerPage, sortConfig);
  };

  const handleItemsPerPageChange = (newSize) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
    fetchPage(1, newSize, sortConfig);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(sortedData.map((item) => item.id));
    } else {
      setSelectedRows([]);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">Show</label>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
            className="border border-gray-300 rounded-md p-1"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span className="text-sm text-gray-600">entries</span>
        </div>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                type="checkbox"
                checked={selectedRows.length === sortedData.length && sortedData.length > 0}
                onChange={handleSelectAll}
              />
            </th>
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => onSort(column.key)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              >
                {column.label}
                {sortConfig.key === column.key && (
                  <span>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>
                )}
              </th>
            ))}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((item, index) => (
            <tr key={item.id || `${item.timestamp}-${index}`}>
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedRows.includes(item.id)}
                  onChange={() => onSelect(item.id)}
                />
              </td>
              {columns.map((column) => (
                <td key={`${column.key}-${item.id || item.timestamp}-${index}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {column.render ? column.render(item) : item[column.key] || "-"}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {onEdit && (
                  <button
                    onClick={() => onEdit(item)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between items-center p-4">
        <p className="text-sm text-gray-600">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} entries
        </p>
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;