const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-4 px-6 border-t border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-secondary-500 dark:text-secondary-400">
        <p>
          © {currentYear} Intelligent CCTV System. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-primary-600 dark:hover:text-primary-400">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-primary-600 dark:hover:text-primary-400">
            Terms of Service
          </a>
          <a href="#" className="hover:text-primary-600 dark:hover:text-primary-400">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;