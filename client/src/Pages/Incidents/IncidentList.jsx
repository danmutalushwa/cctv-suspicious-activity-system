import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Grid, List } from 'lucide-react';
import { useIncidents } from '../../hooks/useIncidents';
import { usePagination } from '../../hooks/usePagination';
import PageHeader from '../../components/Layout/PageHeader';
import Button from '../../components/Common/Button';
import Pagination from '../../components/Common/Pagination';
import EmptyState from '../../components/Common/EmptyState';
import Alert from '../../components/Common/Alert';
import {
  IncidentCard,
  IncidentTable,
  IncidentFilters,
} from '../../components/Incidents';
import { ROUTES } from '../../constants/routes';
import classNames from 'classnames';

const IncidentList = () => {
  const [viewMode, setViewMode] = useState('table');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    type: '',
    severity: '',
  });
  const [sortBy, setSortBy] = useState('detectedAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const pagination = usePagination(1, 10);

  const queryParams = {
    page: pagination.page,
    limit: pagination.limit,
    sortBy,
    sortOrder,
    ...Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '')
    ),
  };

  const { data, isLoading, isError, error } = useIncidents(queryParams);

  const incidents = data?.data?.incidents || [];
  const totalItems = data?.data?.pagination?.total || 0;

  // Update pagination total when data loads
  if (data?.data?.pagination?.total !== undefined && pagination.total !== totalItems) {
    pagination.setTotal(totalItems);
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    pagination.setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ search: '', status: '', type: '', severity: '' });
    pagination.setPage(1);
  };

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    pagination.setPage(1);
  };

  const handlePageChange = (newPage) => {
    pagination.setPage(newPage);
  };

  const handlePageSizeChange = (newSize) => {
    pagination.changeLimit(newSize);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <>
      <PageHeader
        title="Incidents"
        subtitle="Manage and investigate security incidents"
        actions={
          <Link to={ROUTES.CREATE_INCIDENT}>
            <Button variant="primary" icon={Plus}>
              New Incident
            </Button>
          </Link>
        }
      />

      <div className="mb-6">
        <IncidentFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          showReset={hasActiveFilters}
        />
      </div>

      {isError && (
        <Alert
          type="danger"
          title="Failed to load incidents"
          message={error?.userMessage || 'Please try again later.'}
          className="mb-6"
        />
      )}

      {/* View Toggle */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-secondary-500 dark:text-secondary-400">
          {isLoading ? 'Loading...' : `${totalItems} incidents found`}
        </p>
        <div className="flex items-center gap-1 bg-secondary-100 dark:bg-secondary-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={classNames(
              'p-1.5 rounded transition-colors',
              viewMode === 'table'
                ? 'bg-white dark:bg-secondary-700 shadow-sm'
                : 'text-secondary-500 hover:text-secondary-700'
            )}
            aria-label="Table view"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={classNames(
              'p-1.5 rounded transition-colors',
              viewMode === 'grid'
                ? 'bg-white dark:bg-secondary-700 shadow-sm'
                : 'text-secondary-500 hover:text-secondary-700'
            )}
            aria-label="Grid view"
          >
            <Grid size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isLoading && incidents.length === 0 ? (
        <EmptyState
          title="No incidents found"
          description={
            hasActiveFilters
              ? 'Try adjusting your filters or search terms.'
              : 'There are no incidents yet. Create one to get started.'
          }
          action={
            <Link to={ROUTES.CREATE_INCIDENT}>
              <Button variant="primary" icon={Plus}>
                Create Incident
              </Button>
            </Link>
          }
        />
      ) : viewMode === 'table' ? (
        <IncidentTable
          incidents={incidents}
          loading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 bg-secondary-100 dark:bg-secondary-800 rounded-lg animate-pulse"
                />
              ))
            : incidents.map((incident) => (
                <IncidentCard key={incident._id} incident={incident} />
              ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && incidents.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={totalItems}
            pageSize={pagination.limit}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}
    </>
  );
};

export default IncidentList;