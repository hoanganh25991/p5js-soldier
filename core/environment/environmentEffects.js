// Environment Effects Module
// Handles day/night cycle and weather effects

// Weather types
export const WEATHER_TYPES = {
  CLEAR: 'clear',
  RAIN: 'rain',
  STORM: 'storm',
  FOG: 'fog'
};

// Update time of day and weather
export function updateEnvironment(gameState) {
  // Update time of day (cycles from 0 to 1)
  gameState.timeOfDay = (gameState.timeOfDay + (1 / gameState.dayLength)) % 1;
  
  // Update weather
  updateWeather(gameState);
  
  // Apply environment effects based on time and weather
  applyEnvironmentEffects(gameState);
}

// Update weather conditions
function updateWeather(gameState) {
  // Decrease weather timer
  gameState.weatherTimer--;
  
  // Change weather when timer reaches zero
  if (gameState.weatherTimer <= 0) {
    changeWeather(gameState);
    
    // Set new timer for next weather change (between 10-30 seconds)
    gameState.weatherTimer = random(600, 1800);
  }
  
  // Gradually change weather intensity
  if (gameState.weather !== WEATHER_TYPES.CLEAR) {
    // If weather is active, intensity fluctuates
    if (gameState.weatherIntensity < 0.8) {
      gameState.weatherIntensity += 0.001;
    } else {
      // Random fluctuations at high intensity
      gameState.weatherIntensity += random(-0.005, 0.005);
      gameState.weatherIntensity = constrain(gameState.weatherIntensity, 0.7, 1.0);
    }
  } else {
    // Clear weather - decrease intensity
    gameState.weatherIntensity = max(0, gameState.weatherIntensity - 0.01);
  }
}

// Change to a new weather type
function changeWeather(gameState) {
  // Get all weather types
  const weatherTypes = Object.values(WEATHER_TYPES);
  
  // Higher chance of clear weather
  if (random() < 0.6) {
    gameState.weather = WEATHER_TYPES.CLEAR;
  } else {
    // Random weather excluding current weather
    let newWeather;
    do {
      newWeather = weatherTypes[Math.floor(random(weatherTypes.length))];
    } while (newWeather === gameState.weather);
    
    gameState.weather = newWeather;
    
    // Reset intensity for new weather
    gameState.weatherIntensity = 0.1;
  }
}

// Apply visual and gameplay effects based on environment
function applyEnvironmentEffects(gameState) {
  // Time of day affects lighting
  const isDaytime = gameState.timeOfDay > 0.25 && gameState.timeOfDay < 0.75;
  const isSunrise = gameState.timeOfDay > 0.2 && gameState.timeOfDay < 0.3;
  const isSunset = gameState.timeOfDay > 0.7 && gameState.timeOfDay < 0.8;
  
  // Calculate ambient light level based on time of day
  let ambientLevel;
  
  if (isDaytime) {
    // Full daylight at noon (0.5)
    ambientLevel = 100 - Math.abs(gameState.timeOfDay - 0.5) * 100;
  } else if (gameState.timeOfDay < 0.25) {
    // Night to sunrise transition
    ambientLevel = map(gameState.timeOfDay, 0, 0.25, 20, 60);
  } else {
    // Sunset to night transition
    ambientLevel = map(gameState.timeOfDay, 0.75, 1, 60, 20);
  }
  
  // Weather affects ambient light
  if (gameState.weather === WEATHER_TYPES.STORM) {
    ambientLevel *= (1 - gameState.weatherIntensity * 0.5);
  } else if (gameState.weather === WEATHER_TYPES.FOG) {
    ambientLevel *= (1 - gameState.weatherIntensity * 0.2);
  }
  
  // Set the ambient light
  gameState.ambientLight = ambientLevel;
  
  // Weather-specific effects
  if (gameState.weather === WEATHER_TYPES.RAIN || gameState.weather === WEATHER_TYPES.STORM) {
    // Create rain particles if needed
    if (!gameState.rainParticles || gameState.rainParticles.length === 0) {
      gameState.rainParticles = createRainParticles(gameState.weather === WEATHER_TYPES.STORM ? 500 : 200);
    }
  } else {
    // Clear rain particles for other weather types
    gameState.rainParticles = [];
  }
  
  // Fog effect
  gameState.fogDensity = gameState.weather === WEATHER_TYPES.FOG ? gameState.weatherIntensity : 0;
}

// Create rain particles
function createRainParticles(count) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: random(-1000, 1000),
      y: random(-1000, 0),
      z: random(-1000, 1000),
      speed: random(10, 20),
      length: random(10, 30)
    });
  }
  return particles;
}

// Draw environment effects
export function drawEnvironmentEffects(gameState) {
  // Draw sky color based on time of day
  drawSky(gameState);
  
  // Draw weather effects
  drawWeather(gameState);
}

// Draw sky with appropriate color based on time of day
function drawSky(gameState) {
  // Sky colors for different times of day
  let skyColor;
  
  if (gameState.timeOfDay < 0.25) { // Night to sunrise
    // Transition from night blue to sunrise orange
    const t = map(gameState.timeOfDay, 0, 0.25, 0, 1);
    skyColor = lerpColor(
      color(20, 30, 60), // Night blue
      color(255, 150, 50), // Sunrise orange
      t
    );
  } else if (gameState.timeOfDay < 0.3) { // Sunrise to day
    const t = map(gameState.timeOfDay, 0.25, 0.3, 0, 1);
    skyColor = lerpColor(
      color(255, 150, 50), // Sunrise orange
      color(135, 206, 235), // Day blue
      t
    );
  } else if (gameState.timeOfDay < 0.7) { // Day
    skyColor = color(135, 206, 235); // Day blue
  } else if (gameState.timeOfDay < 0.75) { // Day to sunset
    const t = map(gameState.timeOfDay, 0.7, 0.75, 0, 1);
    skyColor = lerpColor(
      color(135, 206, 235), // Day blue
      color(255, 100, 50), // Sunset orange
      t
    );
  } else if (gameState.timeOfDay < 0.8) { // Sunset to night
    const t = map(gameState.timeOfDay, 0.75, 0.8, 0, 1);
    skyColor = lerpColor(
      color(255, 100, 50), // Sunset orange
      color(20, 30, 60), // Night blue
      t
    );
  } else { // Night
    skyColor = color(20, 30, 60); // Night blue
  }
  
  // Apply weather effects to sky color
  if (gameState.weather === WEATHER_TYPES.STORM) {
    // Darker, more gray for storms
    skyColor = lerpColor(
      skyColor,
      color(50, 50, 70),
      gameState.weatherIntensity
    );
  } else if (gameState.weather === WEATHER_TYPES.RAIN) {
    // Slightly darker and grayer for rain
    skyColor = lerpColor(
      skyColor,
      color(100, 100, 120),
      gameState.weatherIntensity
    );
  } else if (gameState.weather === WEATHER_TYPES.FOG) {
    // Whiter for fog
    skyColor = lerpColor(
      skyColor,
      color(200, 200, 200),
      gameState.weatherIntensity
    );
  }
  
  // Set background color
  background(red(skyColor), green(skyColor), blue(skyColor));
}

// Draw weather effects
function drawWeather(gameState) {
  // Draw rain/storm
  if (gameState.weather === WEATHER_TYPES.RAIN || gameState.weather === WEATHER_TYPES.STORM) {
    drawRain(gameState);
    
    // Add lightning for storms
    if (gameState.weather === WEATHER_TYPES.STORM && random() < 0.01 * gameState.weatherIntensity) {
      drawLightning(gameState);
    }
  }
  
  // Draw fog
  if (gameState.weather === WEATHER_TYPES.FOG || gameState.fogDensity > 0) {
    drawFog(gameState);
  }
}

// Draw rain particles
function drawRain(gameState) {
  push();
  stroke(200, 200, 255, 150);
  strokeWeight(1);
  
  // Draw each rain drop
  for (let i = 0; i < gameState.rainParticles.length; i++) {
    const drop = gameState.rainParticles[i];
    
    // Draw rain drop as a line
    line(drop.x, drop.y, drop.z, drop.x, drop.y + drop.length, drop.z);
    
    // Update position
    drop.y += drop.speed;
    
    // Reset if out of view
    if (drop.y > 1000) {
      drop.y = random(-1000, 0);
      drop.x = random(-1000, 1000);
      drop.z = random(-1000, 1000);
    }
  }
  
  pop();
}

// Draw lightning flash
function drawLightning(gameState) {
  // Create a bright flash
  ambientLight(255, 255, 255);
  
  // Reset after a short time
  setTimeout(() => {
    ambientLight(gameState.ambientLight);
  }, 100);
}

// Draw fog effect
function drawFog(gameState) {
  push();
  noStroke();
  
  // Semi-transparent white for fog
  fill(255, 255, 255, gameState.fogDensity * 150);
  
  // Draw fog as a series of overlapping planes at different depths
  for (let z = -1000; z < 1000; z += 200) {
    push();
    translate(0, 0, z);
    plane(2000, 2000);
    pop();
  }
  
  pop();
}

// Get gameplay modifiers based on environment
export function getEnvironmentModifiers(gameState) {
  const modifiers = {
    enemySpeedMultiplier: 1.0,
    enemyDamageMultiplier: 1.0,
    playerSpeedMultiplier: 1.0,
    playerDamageMultiplier: 1.0,
    visibilityRange: 1000
  };
  
  // Time of day effects
  const isDaytime = gameState.timeOfDay > 0.25 && gameState.timeOfDay < 0.75;
  
  if (!isDaytime) {
    // Night time - enemies are stronger, player is weaker
    modifiers.enemySpeedMultiplier *= 1.2;
    modifiers.enemyDamageMultiplier *= 1.2;
    modifiers.visibilityRange = 600;
  }
  
  // Weather effects
  switch (gameState.weather) {
    case WEATHER_TYPES.RAIN:
      // Rain - slower movement for everyone
      modifiers.enemySpeedMultiplier *= (1 - gameState.weatherIntensity * 0.2);
      modifiers.playerSpeedMultiplier *= (1 - gameState.weatherIntensity * 0.1);
      modifiers.visibilityRange *= (1 - gameState.weatherIntensity * 0.2);
      break;
      
    case WEATHER_TYPES.STORM:
      // Storm - much slower movement, reduced visibility
      modifiers.enemySpeedMultiplier *= (1 - gameState.weatherIntensity * 0.3);
      modifiers.playerSpeedMultiplier *= (1 - gameState.weatherIntensity * 0.2);
      modifiers.visibilityRange *= (1 - gameState.weatherIntensity * 0.4);
      break;
      
    case WEATHER_TYPES.FOG:
      // Fog - greatly reduced visibility, enemies are stealthier
      modifiers.visibilityRange *= (1 - gameState.weatherIntensity * 0.6);
      modifiers.enemyDamageMultiplier *= (1 + gameState.weatherIntensity * 0.2);
      break;
  }
  
  return modifiers;
}