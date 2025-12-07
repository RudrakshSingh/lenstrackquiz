// lib/quizEngine.js
// Dynamic Quiz Engine with branching logic

/**
 * Build requirement profile from quiz answers
 */
export function buildRequirementProfile(answers, visionType, severity) {
  const {
    deviceHours = 0,
    outdoorExposure = 'minimal',
    driving = 'none',
    symptoms = [],
    preferences = 'none',
    screenHours = 0,
    outdoorHours = 0,
    drivingPattern = 'none',
    secondPairInterest = 'none'
  } = answers;
  
  // Calculate levels from answers
  const screenLoadLevel = calculateDeviceSeverity(screenHours || deviceHours);
  const outdoorLevel = calculateOutdoorSeverity(outdoorExposure || outdoorHours);
  const drivingLevel = calculateDrivingSeverity(driving || drivingPattern);
  
  // Extract lifestyle tags from answers
  const lifestyleTags = extractLifestyleTags(answers);
  
  // Determine required feature levels
  const blueProtectionLevel = Math.min(screenLoadLevel, 5);
  const arLevel = screenLoadLevel >= 3 ? 4 : (screenLoadLevel >= 2 ? 3 : 2);
  const uvLevel = outdoorLevel >= 3 ? 4 : (outdoorLevel >= 2 ? 3 : 2);
  
  // Photochromic need
  let photochromicNeed = 'none';
  if (outdoorLevel >= 3) {
    photochromicNeed = 'recommended';
  } else if (outdoorLevel >= 2) {
    photochromicNeed = 'optional';
  }
  
  return {
    vision_type: visionType,
    screen_load_level: screenLoadLevel,
    blue_protection_level: blueProtectionLevel,
    ar_level: arLevel,
    uv_level: uvLevel,
    driving_level: drivingLevel,
    photochromic_need: photochromicNeed,
    symptoms: Array.isArray(symptoms) ? symptoms : [symptoms].filter(Boolean),
    priority: determinePriority(preferences, lifestyleTags),
    second_pair_interest: secondPairInterest,
    lifestyle_tags: lifestyleTags
  };
}

/**
 * Extract lifestyle tags from quiz answers
 */
function extractLifestyleTags(answers) {
  const tags = [];
  
  // Screen usage tags
  const screenHours = answers.screenHours || answers.deviceHours || 0;
  if (screenHours >= 8) tags.push('SCREEN_HIGH');
  else if (screenHours >= 4) tags.push('SCREEN_MEDIUM');
  else tags.push('SCREEN_LOW');
  
  // Driving tags
  const driving = answers.driving || answers.drivingPattern || 'none';
  if (driving === 'daily night' || driving === 'professional') {
    tags.push('DRIVER_NIGHT');
  }
  if (driving !== 'none') {
    tags.push('DRIVER');
  }
  
  // Outdoor tags
  const outdoor = answers.outdoorExposure || answers.outdoorHours || 'minimal';
  if (outdoor === '6+ hrs' || outdoor === 'extensive') {
    tags.push('OUTDOOR_HIGH');
  } else if (outdoor !== 'minimal') {
    tags.push('OUTDOOR_MEDIUM');
  }
  
  // Work tags
  if (answers.workType) {
    if (answers.workType === 'office' || answers.workType === 'computer') {
      tags.push('OFFICE_WORKER');
    }
    if (answers.workType === 'creative' || answers.workType === 'design') {
      tags.push('CREATIVE_WORKER');
    }
  }
  
  // Symptoms tags
  const symptoms = answers.symptoms || [];
  if (Array.isArray(symptoms)) {
    if (symptoms.includes('eye_strain') || symptoms.includes('Eye strain')) {
      tags.push('EYE_STRAIN');
    }
    if (symptoms.includes('headache') || symptoms.includes('Headaches')) {
      tags.push('HEADACHE');
    }
  }
  
  return tags;
}

/**
 * Determine priority based on preferences
 */
function determinePriority(preferences, tags) {
  if (preferences === 'clarity' || tags.includes('CREATIVE_WORKER')) {
    return 'clarity';
  }
  if (preferences === 'protection' || tags.includes('SCREEN_HIGH')) {
    return 'protection';
  }
  if (preferences === 'style' || tags.includes('FASHION_FOCUSED')) {
    return 'style';
  }
  return 'balanced';
}

/**
 * Calculate device severity (imported from lensAdvisorEngine)
 */
function calculateDeviceSeverity(hours) {
  if (hours === 0 || hours < 2) return 0;
  if (hours < 4) return 1;
  if (hours < 6) return 2;
  if (hours < 8) return 3;
  if (hours < 12) return 4;
  return 5;
}

/**
 * Calculate outdoor severity
 */
function calculateOutdoorSeverity(exposure) {
  if (typeof exposure === 'number') {
    if (exposure < 1) return 0;
    if (exposure < 3) return 2;
    if (exposure < 6) return 3;
    return 4;
  }
  
  const exposureMap = {
    'minimal': 0,
    '1-3 hrs': 2,
    '3-6 hrs': 3,
    '6+ hrs': 4,
    'extensive': 5
  };
  return exposureMap[exposure] ?? 0;
}

/**
 * Calculate driving severity
 */
function calculateDrivingSeverity(driving) {
  const drivingMap = {
    'none': 0,
    'day only': 1,
    'some night': 2,
    'daily night': 4,
    'professional': 5
  };
  return drivingMap[driving] ?? 0;
}

/**
 * Get next question based on branching logic
 */
export function getNextQuestion(currentQuestion, selectedOption, allQuestions) {
  if (!currentQuestion || !selectedOption) return null;
  
  // Check if option has a branch target
  if (selectedOption.branchesTo) {
    return allQuestions.find(q => q.id === selectedOption.branchesTo);
  }
  
  // Use default next question
  if (currentQuestion.defaultNext) {
    return allQuestions.find(q => q.id === currentQuestion.defaultNext);
  }
  
  // Return next question in order
  const currentIndex = allQuestions.findIndex(q => q.id === currentQuestion.id);
  if (currentIndex >= 0 && currentIndex < allQuestions.length - 1) {
    return allQuestions[currentIndex + 1];
  }
  
  return null;
}

/**
 * Filter questions by vision type
 */
export function filterQuestionsByVisionType(questions, visionType) {
  return questions.filter(q => {
    // If question has no vision type restriction, show for all
    if (!q.visionTypes || q.visionTypes.length === 0) return true;
    
    // Check if question is relevant for this vision type
    return q.visionTypes.includes(visionType);
  });
}

/**
 * Get starting question group for vision type
 */
export function getStartingQuestionGroup(visionType, questionGroups) {
  // Map vision types to default question groups
  const groupMap = {
    'ZERO_POWER': 'G_PROTECTION',
    'SV_DISTANCE': 'G_LIFESTYLE',
    'SV_NEAR': 'G_LIFESTYLE',
    'PROGRESSIVE': 'G_LIFESTYLE_ADVANCED',
    'BIFOCAL': 'G_LIFESTYLE_ADVANCED'
  };
  
  const defaultGroup = groupMap[visionType] || 'G_LIFESTYLE';
  return questionGroups.find(g => g.id === defaultGroup) || questionGroups[0];
}
