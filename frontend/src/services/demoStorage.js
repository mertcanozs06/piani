export const isDemoMode = () => (
  localStorage.getItem('anipini_demo_mode') === 'true'
  || localStorage.getItem('anipini_token') === 'mock_jwt_token_pastel'
);

export const readDemoPins = (userId) => {
  try {
    const stored = JSON.parse(localStorage.getItem(`anipini_demo_pins_${userId}`) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.warn('Demo pinleri okunamadı:', error);
    return [];
  }
};

export const writeDemoPins = (userId, pins) => {
  try {
    localStorage.setItem(`anipini_demo_pins_${userId}`, JSON.stringify(pins));
  } catch (error) {
    console.warn('Demo pinleri kaydedilemedi:', error);
  }
};

export const upsertDemoPin = (userId, pin) => {
  const pins = readDemoPins(userId);
  const existingIndex = pins.findIndex(item => String(item.id) === String(pin.id));
  const previous = existingIndex >= 0 ? pins[existingIndex] : null;
  const memories = [...(pin.memories || [])];
  for (const previousMemory of previous?.memories || []) {
    if (!memories.some(memory => String(memory.id) === String(previousMemory.id))) {
      memories.push(previousMemory);
    }
  }
  const updatedPin = {
    ...previous,
    ...pin,
    memories,
    memoryCount: memories.length
  };
  const updatedPins = existingIndex >= 0
    ? pins.map((item, index) => index === existingIndex ? updatedPin : item)
    : [updatedPin, ...pins];
  writeDemoPins(userId, updatedPins);
  return updatedPin;
};

export const deleteDemoPinForMemory = (userId, memoryId) => {
  const pins = readDemoPins(userId);
  const matchingPin = pins.find(pin => (
    (pin.memories || []).some(memory => String(memory.id) === String(memoryId))
  ));
  if (!matchingPin) return null;
  writeDemoPins(userId, pins.filter(pin => String(pin.id) !== String(matchingPin.id)));
  return matchingPin;
};

export const readDemoComments = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(`anipini_demo_comments_${userId}`) || '{}');
  } catch (error) {
    console.warn('Demo yorumları okunamadı:', error);
    return {};
  }
};

export const writeDemoComments = (userId, memoryId, comments) => {
  try {
    const stored = readDemoComments(userId);
    stored[String(memoryId)] = comments;
    localStorage.setItem(`anipini_demo_comments_${userId}`, JSON.stringify(stored));
  } catch (error) {
    console.warn('Demo yorumları kaydedilemedi:', error);
  }
};
