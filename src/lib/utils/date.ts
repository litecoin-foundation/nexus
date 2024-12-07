export const formatDate = (date: number) => {
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

export const formatTime = (time: number) => {
  const jsTime = new Date(time);
  return jsTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
  });
};

export const formatMonths = (date: number) => {
  const jsDate = new Date(date);
  const time = new Date();

  if (jsDate.getFullYear() === time.getFullYear()) {
    return jsDate.toLocaleDateString('en-US', {month: 'long'});
  }

  return jsDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

export const formatTxDate = (timestamp: number) => {
  const jsDate = new Date(timestamp * 1000);

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const year = jsDate.getFullYear();
  const month = months[jsDate.getMonth()];
  const date = jsDate.getDate();

  const time = jsDate.toLocaleString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  });

  const dateString = date + ' ' + month + ' ' + year + ', ' + time;

  return dateString;
};
