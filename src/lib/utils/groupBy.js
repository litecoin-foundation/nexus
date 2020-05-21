const groupBy = (objectArray, property) => {
  // TODO: cleanup later (inefficient)
  const array1 = [];
  objectArray.map((obj) => {
    const bool = array1.find((e) => {
      if (e.title !== obj[property]) {
        return false;
      }
      return e.title === obj[property];
    });
    if (!bool) {
      array1.push({title: obj[property], data: []});
    }
    array1.find((e) => {
      if (e.title === obj[property]) {
        e.data.push(obj);
      }
    });
  });
  // eslint-disable-next-line no-unused-vars
  for (const i in array1) {
    array1[i].data.reverse();
  }
  array1.reverse();
  return array1;
};

export default groupBy;
