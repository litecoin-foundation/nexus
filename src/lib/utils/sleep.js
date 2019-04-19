const sleep = (milliseconds = 5000) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

export default sleep;
