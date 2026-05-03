export const WORLD = {
  WIDTH: 2560,
  HEIGHT: 1440,
};

export const BEE = {
  SPEED: 200,
  HP: 5,
  SAP_CAPACITY: 10,
  STINGER_RATE: 800,         // ms between auto-fire shots
  STINGER_SPEED: 400,
  STINGER_DAMAGE: 1,
  STINGER_RANGE: 200,
  RESPAWN_COST: 20,
};

export const HIVE = {
  HP: 10,
  HONEY_STORAGE: 100,
  SAP_CONVERSION_RATE: 1,    // honey per sap unit
  SAP_CONVERSION_INTERVAL: 2000, // ms between conversions (converts 1 sap at a time)
};

export const WASP = {
  HUNTER_SPEED: 150,
  RAIDER_SPEED: 120,
  HP: 3,
  SAP_STEAL: 3,
  HONEY_STEAL: 5,
  DAMAGE: 1,
  HIT_COOLDOWN: 1000,        // ms between hits from same wasp
};

export const WAVE = {
  FIRST_WAVE_DELAY: 15000,
  WAVE_INTERVAL: 30000,
  BASE_COUNT: 3,
  COUNT_INCREMENT: 2,
};

export const FLOWER = {
  SAP_AMOUNT: 5,
  POLLINATION_RADIUS: 150,
  SPAWN_DELAY: 6000,
  INITIAL_COUNT: 20,
};

export const TIMER = {
  RUN_DURATION: 600000,      // 10 minutes
};
