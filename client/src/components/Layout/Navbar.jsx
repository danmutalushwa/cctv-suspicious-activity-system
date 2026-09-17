import { Menu, Search } from 'lucide-react';
import PropTypes from 'prop-types';
import NotificationDropdown from './NotificationDropdown';
import UserDropdown from './UserDropdown';
import ConnectionStatus from '../Common/ConnectionStatus';

const Navbar = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700">
      <div className="flex items-center justify-between h-full px-4 lg:px-6 gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 rounded-lg text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search incidents, alerts, videos..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-secondary-300 dark:border-secondary-600 bg-secondary-50 dark:bg-secondary-900 text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ConnectionStatus />
          </div>
          <NotificationDropdown />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

Navbar.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
};

export default Navbar;