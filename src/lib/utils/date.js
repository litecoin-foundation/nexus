export const formatDate = date => {
  const ONE_DAY = 60 * 60 * 24 * 1000;
  const jsDate = new Date(date);
  const time = new Date();
  const diff = time - jsDate;

  if (diff < ONE_DAY) {
    return 'Today';
  }

  if (diff > ONE_DAY && jsDate.getFullYear() === time.getFullYear()) {
    return jsDate.toLocaleDateString('en-US', {month: 'long', day: 'numeric'});
  }

  return jsDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatTime = time => {
  const jsTime = new Date(time * 1000);
  return jsTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
  });
};
