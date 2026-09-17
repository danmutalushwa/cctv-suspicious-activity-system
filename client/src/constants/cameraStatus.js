export const CAMERA_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  RECORDING: 'recording',
  ERROR: 'error',
};

export const CAMERA_STATUS_LABELS = {
  [CAMERA_STATUS.ONLINE]: 'Online',
  [CAMERA_STATUS.OFFLINE]: 'Offline',
  [CAMERA_STATUS.RECORDING]: 'Recording',
  [CAMERA_STATUS.ERROR]: 'Error',
};

export const CAMERA_STATUS_COLORS = {
  [CAMERA_STATUS.ONLINE]: 'success',
  [CAMERA_STATUS.OFFLINE]: 'secondary',
  [CAMERA_STATUS.RECORDING]: 'danger',
  [CAMERA_STATUS.ERROR]: 'warning',
};

export const CAMERA_RESOLUTIONS = [
  { value: '640x480', label: '640 × 480 (SD)' },
  { value: '1280x720', label: '1280 × 720 (HD)' },
  { value: '1920x1080', label: '1920 × 1080 (Full HD)' },
  { value: '2560x1440', label: '2560 × 1440 (2K)' },
  { value: '3840x2160', label: '3840 × 2160 (4K)' },
];

export const CAMERA_FRAMERATES = [15, 24, 25, 30, 60];

export const CAMERA_STATUS_OPTIONS = Object.values(CAMERA_STATUS).map((value) => ({
  value,
  label: CAMERA_STATUS_LABELS[value],
}));