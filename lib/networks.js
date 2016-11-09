const kilobitsToKiloBytes = function (num) {
  return (num / 8) * 1024;
};

// These networks match Google Chrome's default network throttle settings
let networks = {
  WIFI: {
    latency: 2,
    downloadThroughput: kilobitsToKiloBytes(30000),
    uploadThroughput: kilobitsToKiloBytes(15000),
  },
  DSL: {
    latency: 5,
    downloadThroughput: kilobitsToKiloBytes(2000),
    uploadThroughput: kilobitsToKiloBytes(1000),
  },
  '4G-REGULAR': {
    latency: 20,
    downloadThroughput: kilobitsToKiloBytes(4000),
    uploadThroughput: kilobitsToKiloBytes(3000),
  },
  '3G-GOOD': {
    latency: 40,
    downloadThroughput: kilobitsToKiloBytes(1500),
    uploadThroughput: kilobitsToKiloBytes(750),
  },
  '3G-REGULAR': {
    latency: 100,
    downloadThroughput: kilobitsToKiloBytes(750),
    uploadThroughput: kilobitsToKiloBytes(250),
  },
  '2G-GOOD': {
    latency: 150,
    downloadThroughput: kilobitsToKiloBytes(450),
    uploadThroughput: kilobitsToKiloBytes(150),
  },
  '2G-REGULAR': {
    latency: 300,
    downloadThroughput: kilobitsToKiloBytes(250),
    uploadThroughput: kilobitsToKiloBytes(50),
  },
  GPRS: {
    latency: 500,
    downloadThroughput: kilobitsToKiloBytes(50),
    uploadThroughput: kilobitsToKiloBytes(20),
  },
};

networks['4G'] = networks['4G-REGULAR'];
networks['3G'] = networks['3G-GOOD'];
networks['2G'] = networks['2G-GOOD'];

module.exports = networks;
