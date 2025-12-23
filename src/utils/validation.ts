// Form validation utilities

export const validatePlaceTitle = (title: string): string | null => {
  if (!title || title.trim().length === 0) {
    return 'Title is required';
  }
  if (title.trim().length < 3) {
    return 'Title must be at least 3 characters';
  }
  if (title.trim().length > 100) {
    return 'Title must be less than 100 characters';
  }
  return null;
};

export const validateCity = (city: string): string | null => {
  if (!city || city.trim().length === 0) {
    return 'City is required';
  }
  if (city.trim().length < 2) {
    return 'City must be at least 2 characters';
  }
  return null;
};

export const validateCapacity = (capacity: string): string | null => {
  if (capacity && capacity.trim().length > 0) {
    const num = parseInt(capacity);
    if (isNaN(num) || num < 1 || num > 10000) {
      return 'Capacity must be a number between 1 and 10000';
    }
  }
  return null;
};

export const validateCoordinates = (lat: number, lng: number): string | null => {
  if (lat < -90 || lat > 90) {
    return 'Invalid latitude';
  }
  if (lng < -180 || lng > 180) {
    return 'Invalid longitude';
  }
  return null;
};
