const groupBy = (objectArray, property) => {
  // TODO: cleanup later (inefficient)
  let array1 = [];
  objectArray.map(obj => {
    const bool = array1.find(e => {
      if (e.title !== obj[property]) {
        return false;
      }
      return e.title === obj[property];
    });
    if (!bool) {
      array1.push({ title: obj[property], data: [] });
    }

    array1.find(e => {
      if (e.title === obj[property]) {
        e.data.push(obj);
      }
    });
  });

  return array1;
};

export default groupBy;
