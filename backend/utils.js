// utils.js

function calculateDailyGoals({ age, height, weight, gender, activityLevel, goalWeight }) {
    // Calculate BMR using the Mifflin-St Jeor Equation
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    
    // Define activity multipliers
    const activityMultipliers = {
      'BMR': 1.0,
      'Sedentary': 1.2,
      'Light': 1.375,
      'Moderate': 1.55,
      'Active': 1.725,
      'Very Active': 1.9,
      'Extremely Active': 2.0
    };
    
    const multiplier = activityMultipliers[activityLevel] || 1.2;
    const maintenanceCalories = bmr * multiplier;
  
    // Simple adjustment: if current weight is above goal, subtract calories; if below, add calories
    // (This is a simplistic approach—real formulas might be more complex)
    const adjustment = (weight - goalWeight) * 20; 
    const dailyCalories = maintenanceCalories - adjustment;
  
    // Define macro ratios (example: 40% carbs, 30% protein, 30% fat)
    const carbsCalories = dailyCalories * 0.4;
    const proteinCalories = dailyCalories * 0.3;
    const fatCalories = dailyCalories * 0.3;
  
    const carbs = Math.round(carbsCalories / 4);    // 4 calories per gram of carbohydrate
    const protein = Math.round(proteinCalories / 4);  // 4 calories per gram of protein
    const fat = Math.round(fatCalories / 9);          // 9 calories per gram of fat
  
    return {
      dailyCalories: Math.round(dailyCalories),
      carbs,
      protein,
      fat
    };
  }
  
  module.exports = { calculateDailyGoals };
  