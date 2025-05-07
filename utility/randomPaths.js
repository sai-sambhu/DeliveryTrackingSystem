const { deliverDriversCoordinates } = require('../datasets/deliveryDriversCoordinates');

// Store driver-wise optimal usage
const driversOptimalPathInfo = {};

function getRandomPath(driver) {
  const useOptimal = Math.random() < 0.5;
  driversOptimalPathInfo[driver.name] = useOptimal; // Record optimal/deviated path usage

  const selectedPath = useOptimal ? driver.optimalPath : driver.deviatedPath;

  // Map each coordinate to the required object format
  return selectedPath.map(coord => ({
    name: driver.name,
    lat: coord.lat,
    lng: coord.lng,
    optimal: useOptimal,
  }));
}

function interleavePreservingOrder(lists) {
  const result = [];
  const pointers = new Array(lists.length).fill(0);

  while (pointers.some((ptr, i) => ptr < lists[i].length)) {
    const availableIndexes = pointers
      .map((ptr, idx) => (ptr < lists[idx].length ? idx : null))
      .filter(idx => idx !== null);

    const randomIdx = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];

    result.push(lists[randomIdx][pointers[randomIdx]]);
    pointers[randomIdx]++;
  }

  return result;
}

// Main logic
const selectedPaths = deliverDriversCoordinates.map(getRandomPath);
const allDeliveryDriversMap = interleavePreservingOrder(selectedPaths);

module.exports = { allDeliveryDriversMap, driversOptimalPathInfo };
