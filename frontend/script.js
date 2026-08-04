  // Global variable to store the current user ID after login/registration
  let currentUserId = null;
  let editingFoodId = null;

  document.addEventListener("DOMContentLoaded", () => {
    // Get references to DOM elements
    const authSection = document.getElementById("auth-section");
    const loginPage = document.getElementById("login-page");
    const registerPage = document.getElementById("register-page");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const loginError = document.getElementById("login-error");
    const registerError = document.getElementById("register-error");
    const showRegisterBtn = document.getElementById("show-register");
    const showLoginBtn = document.getElementById("show-login");
    const appSection = document.getElementById("app-section");
    const dashboard = document.getElementById("dashboard");
    const profileSetup = document.getElementById("profile-setup");
    const profileForm = document.getElementById("profile-form");
    const profileMessage = document.getElementById("profile-message");
    const settingsDrawer = document.getElementById("settings-drawer");
    const profileButton = document.getElementById("profile-button");
    const logoutButton = document.getElementById("logout-button");
    const manualLogForm = document.getElementById("manual-log-form");
    const mealHistoryButton = document.getElementById('meal-history-button');
    const mealHistorySection = document.getElementById('meal-history');
    const weightTrackerButton = document.getElementById('weight-tracker-button');
    const weightTrackerSection = document.getElementById('weight-tracker');


// Update event listener for settings button
document.getElementById('settings-button').addEventListener('click', toggleSettings);
document.querySelector('.settings-overlay').addEventListener('click', toggleSettings);


document.querySelectorAll('[data-i18n="language-button"]').forEach(button => {
  button.addEventListener('click', toggleLanguage);
});

// Initialize language
const savedLang = localStorage.getItem('nutritionDiaryLang');
if (savedLang) {
  currentLanguage = savedLang;
  updateTextElements();
}
document.getElementById('language-button').textContent = 
  currentLanguage === 'en' ? 'Switch to Greek' : 'Αλλαγή σε Αγγλικά';




  // Initialize the custom goals section based on the user's selected goal type.
  // Show the section only when "custom" goals are selected and update the required
  // attribute of custom goal inputs to ensure validation matches the selected option.
  const initialGoalType = document.querySelector('input[name="goal-type"]:checked').value;
  const customSection = document.getElementById('custom-goals-section');
  customSection.style.display = initialGoalType === 'custom' ? 'block' : 'none';

  // sync required state on load too, not just on change
  customSection.querySelectorAll('input').forEach(input => {
    input.required = initialGoalType === 'custom';
  });





// Goal type radio buttons handler
document.querySelectorAll('input[name="goal-type"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const customSection = document.getElementById('custom-goals-section');
    customSection.style.display = e.target.value === 'custom' ? 'block' : 'none';
    
    const customInputs = customSection.querySelectorAll('input');
    customInputs.forEach(input => {
      input.required = e.target.value === 'custom';
    });
  });
});




profileButton.addEventListener('click', () => {
  fetch(`http://localhost:3000/user-profile?user_id=${currentUserId}`)
    .then(response => response.json())
    .then(profileData => {
      document.getElementById('age').value = profileData.age || '';
      document.getElementById('height').value = profileData.height || '';
      document.getElementById('current-weight').value = profileData.currentWeight || '';
      document.getElementById('goal-weight').value = profileData.goalWeight || '';
      document.getElementById('activity-level').value = profileData.activityLevel || 'BMR';
      document.getElementById('gender').value = profileData.gender ?? '';

      const goalType = profileData.goal_type || 'app';
      document.querySelector(`input[value="${goalType}"]`).checked = true;
      
      const customSection = document.getElementById('custom-goals-section');
      if (goalType === 'custom') {
        customSection.style.display = 'block';
        document.getElementById('custom-calories').value = profileData.custom_calories || '';
        document.getElementById('custom-carbs').value = profileData.custom_carbs || '';
        document.getElementById('custom-protein').value = profileData.custom_protein || '';
        document.getElementById('custom-fat').value = profileData.custom_fat || '';
      } else {
        customSection.style.display = 'none';
      }
      
      showPage('profile-setup');
    })
    .catch(error => {
      console.error('Profile load error:', error);
      showPage('profile-setup');
    });
});






// stats-button event listener
document.getElementById('stats-button').addEventListener('click', () => {
  showPage('stats-page');
  // Initialize dates to current week
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6);
  document.getElementById('stats-start-date').value = startDate.toISOString().split('T')[0];
  document.getElementById('stats-end-date').value = endDate;
});







// custom-foods-button event listener
document.getElementById('custom-foods-button').addEventListener('click', () => {
  showPage('custom-foods');
  loadCustomFoods();
});





document.getElementById('custom-food-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const foodData = {
    user_id: currentUserId,
    name: document.getElementById('custom-food-name').value,
    calories: document.getElementById('custom-food-calories').value,
    carbs: document.getElementById('custom-food-carbs').value,
    protein: document.getElementById('custom-food-protein').value,
    fats: document.getElementById('custom-food-fats').value
  };

  const endpoint = editingFoodId ? 
    `http://localhost:3000/custom-food/${editingFoodId}` : 
    'http://localhost:3000/custom-food';

  fetch(endpoint, {
    method: editingFoodId ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(foodData)
  }).then(() => {
    editingFoodId = null;
    document.getElementById('custom-food-form').reset();
    loadCustomFoods();
  });
});





weightTrackerButton.addEventListener('click', () => {
  showPage('weight-tracker');
  loadWeightData();
});




mealHistoryButton.addEventListener('click', () => {
  showPage('meal-history');
  document.getElementById('history-date').value = new Date().toISOString().split('T')[0];
  loadMealHistory();
});






    // Toggle between Login and Register views
    showRegisterBtn.addEventListener("click", () => {
      loginPage.style.display = "none";
      registerPage.style.display = "block";
      loginError.textContent = "";
      registerError.textContent = "";
    });

    showLoginBtn.addEventListener("click", () => {
      registerPage.style.display = "none";
      loginPage.style.display = "block";
      loginError.textContent = "";
      registerError.textContent = "";
    });


// Handle Register Form Submission
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("register-username").value.trim();
  const password = document.getElementById("register-password").value;
  registerError.textContent = "";

  fetch("http://localhost:3000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
  .then(handleResponse)
  .then(data => {
    currentUserId = data.userId;
    authSection.style.display = "none";
    appSection.style.display = "block";
    document.getElementById('ai-chat').style.display = 'block';
    
    // Clear profile form fields for new user
    document.getElementById('age').value = '';
    document.getElementById('height').value = '';
    document.getElementById('current-weight').value = '';
    document.getElementById('goal-weight').value = '';
    document.getElementById('activity-level').value = 'BMR'; // Default value
    document.getElementById('custom-goals-section').style.display = 'none';
    document.getElementById('custom-calories').value = '';
    document.getElementById('custom-carbs').value = '';
    document.getElementById('custom-protein').value = '';
    document.getElementById('custom-fat').value = '';
    
    showPage('profile-setup');
  })
  .catch(handleError(registerError));
});

// Handle Login Form Submission
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  loginError.textContent = "";

  fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
  .then(handleResponse)
  .then(data => {
    currentUserId = data.userId;
    authSection.style.display = "none";
    appSection.style.display = "block";
    document.getElementById('ai-chat').style.display = 'block';
    profileSetup.style.display = "none";
    showPage('dashboard'); // This handles water tracker visibility
    initDatePicker();
    updateDashboard();
  })
  .catch(handleError(loginError));
});

    

    // Handle Manual Log Submission
    manualLogForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const logDate = document.getElementById("view-date").value;
      const calories = parseInt(document.getElementById("calories").value);
      const carbs = parseInt(document.getElementById("carbs").value);
      const protein = parseInt(document.getElementById("protein").value);
      const fats = parseInt(document.getElementById("fats").value);

      fetch("http://localhost:3000/food-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          date: logDate,
          calories,
          carbs,
          protein,
          fats
        })
      })
      .then(response => {
        if (!response.ok) throw new Error("Failed to log food");
        updateDashboard();
        manualLogForm.reset();
      })
      .catch(error => {
        console.error("Food log error:", error);
        alert("Failed to save entry: " + error.message);
      });
    });


function toggleSettings() {
  const drawer = document.getElementById('settings-drawer');
  const overlay = document.querySelector('.settings-overlay');

  // If the drawer is hidden (display none), make it visible
  if (drawer.style.display === 'none' || !drawer.style.display) {
    drawer.style.display = 'flex';
  }
  
  // Toggle the active class to slide in the drawer
  drawer.classList.toggle('active');
  overlay.classList.toggle('active');
}





profileForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  // Required Field Checks 
  const goalTypeRadio = document.querySelector('input[name="goal-type"]:checked');
  if (!goalTypeRadio) {
    alert("Please select either 'App Calculated' or 'Custom Goals'!");
    return;
  }
  const goalType = goalTypeRadio.value;

  // Parse Values
  const age = parseInt(document.getElementById('age').value, 10);
  const height = parseInt(document.getElementById('height').value, 10);
  const currentWeight = parseFloat(document.getElementById('current-weight').value);
  const goalWeight = parseFloat(document.getElementById('goal-weight').value);
  const activityLevel = document.getElementById('activity-level').value;
  const gender = parseInt(document.getElementById('gender').value);

  // Validation
  if (isNaN(age)) return alert("Age must be a valid number");
  if (isNaN(height)) return alert("Height must be a valid number");
  if (isNaN(currentWeight)) return alert("Current weight invalid");
  if (isNaN(goalWeight)) return alert("Goal weight invalid");
  if (isNaN(gender)) return alert("Please select a gender");

  // Handle Custom/App Values
  let customCalories = null;
  let customCarbs = null;
  let customProtein = null;
  let customFat = null;

  if (goalType === "custom") {
    customCalories = parseInt(document.getElementById('custom-calories').value) || 0;
    customCarbs = parseInt(document.getElementById('custom-carbs').value) || 0;
    customProtein = parseInt(document.getElementById('custom-protein').value) || 0;
    customFat = parseInt(document.getElementById('custom-fat').value) || 0;
  }

  // Submit Data
  fetch("http://localhost:3000/update-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: currentUserId,
      age,
      height,
      current_weight: currentWeight,
      goal_weight: goalWeight,
      activity_level: activityLevel,
      gender,
      goal_type: goalType,
      custom_calories: customCalories,
      custom_carbs: customCarbs,
      custom_protein: customProtein,
      custom_fat: customFat
    })
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  })
  .then(() => {
      showPage('dashboard');
      updateDashboard();
    })
  .catch(error => {
    profileMessage.style.color = "red";
    profileMessage.textContent = error.message;
  });
});


    // Handle Logout
    logoutButton.addEventListener("click", () => {
      currentUserId = null;
      appSection.style.display = "none";
      authSection.style.display = "block";
      document.getElementById('ai-chat').style.display = 'none';
      loginForm.reset();
      registerForm.reset();
      loginError.textContent = "";
      registerError.textContent = "";
      settingsDrawer.style.display = "none";
      document.getElementById('water-tracker').style.display = 'none';
    });
  });






    // GLOBAL functions start here (defined outside DOMContentLoaded)


//translations part
let currentLanguage = 'en';
const translations = {
  'en': {
  
    'app-title': 'Nutrition Diary App',
    
    // Auth section
    'login-title': 'Login',
    'login-button': 'Login',
    'register-title': 'Register',
    'register-button': 'Register',
    'username-placeholder': 'Username',
    'password-placeholder': 'Password',
    'no-account-text': 'Don\'t have an account?',
    'existing-account-text': 'Already have an account?',
    'switch-language': 'Ελληνικά',
    
    // Profile setup
    'profile-title': 'Profile Setup',
    'back-dashboard': '← Dashboard',
    'age-label': 'Age:',
    'age-placeholder': 'e.g., 25',
    'gender-label': 'Gender:',
    'gender-male': 'Male',
    'gender-female': 'Female',
    'height-label': 'Height (cm):',
    'height-placeholder': 'e.g., 170',
    'current-weight-label': 'Current Weight (kg):',
    'current-weight-placeholder': 'e.g., 70',
    'goal-weight-label': 'Goal Weight (kg):',
    'goal-weight-placeholder': 'e.g., 65',
    'activity-label': 'Activity Level:',
    'activity-bmr': 'Basal Metabolic Rate (BMR)',
    'activity-sedentary': 'Sedentary (little to no exercise)',
    'activity-light': 'Light (exercise 1-3 times/week)',
    'activity-moderate': 'Moderate (exercise 4-5 times/week)',
    'activity-active': 'Active (daily exercise or intense exercise 3-4 times/week)',
    'activity-very-active': 'Very Active (intense exercise 6-7 times/week)',
    'activity-extremely-active': 'Extremely Active (very intense exercise daily or physical job)',
    'goal-type-label': 'Goal Type:',
    'goal-app': 'App Calculated',
    'goal-custom': 'Custom Goals',
    'custom-calories-label': 'Daily Calories:',
    'custom-carbs-label': 'Carbs (g):',
    'custom-protein-label': 'Protein (g):',
    'custom-fat-label': 'Fat (g):',
    'save-profile': 'Save Profile',
    
    // Dashboard
    'view-date-label': 'Viewing Date:',
    'refresh-button': 'Refresh',
    'daily-calories': 'Daily Calories',
    'carbs-label': 'Carbs (g)',
    'protein-label': 'Protein (g)',
    'fats-label': 'Fats (g)',
    'manual-log-title': 'Manual Log',
    'calories-placeholder': 'Calories',
    'carbs-placeholder': 'Carbs (g)',
    'protein-placeholder': 'Protein (g)',
    'fats-placeholder': 'Fats (g)',
    'add-entry-button': 'Add Entry',
    'food-log-title': 'Food Log',
    'search-foods-placeholder': 'Search foods...',
    'grams-placeholder': 'Grams',
    'add-food-button': 'Add Food',
    
    // Settings drawer
    'profile-button': 'Profile',
    'meal-history-button': 'Meal History',
    'weight-tracker-button': 'Weight Tracker',
    'custom-foods-button': 'Custom Foods',
    'stats-button': 'Historical Stats',
    'language-button': 'Switch to Greek',
    'logout-button': 'Logout',
    
    // Custom foods
    'custom-foods-title': 'Custom Foods',
    'food-name-placeholder': 'Food Name',
    'calories-100g': 'Calories/100g',
    'carbs-100g': 'Carbs/100g',
    'protein-100g': 'Protein/100g',
    'fats-100g': 'Fats/100g',
    'save-food-button': 'Save Food',
    
    // Meal history
    'meal-history-title': 'Meal History',
    'load-logs-button': 'Load Logs',
    'manual-entry': 'Manual Entry',
    'calories-label': 'Calories',
    'carbs-label': 'Carbs',
    'protein-label': 'Protein',
    'fats-label': 'Fats',
    'delete-button': 'Delete',
    'edit-button': 'Edit',
    'all-dates-have-logs': 'All dates in range have logs',
    'weight-placeholder': 'Weight (kg)',
    'search-foods': 'Search foods',
    
    // Weight tracker
    'weight-progress-title': 'Weight Progress',
    'weight-placeholder': 'Weight (kg)',
    'log-weight-button': 'Log Weight',
    'weight-history-title': 'Weight History',
    'date-header': 'Date',
    'weight-header': 'Weight (kg)',
    'actions-header': 'Actions',
    
    // Stats page
    'stats-title': 'Historical Nutrition Stats',
    'stats-description': 'View averages between any dates. Select a date range to see:',
    'stats-point1': 'Average daily calories and macros',
    'stats-point2': 'Dates with missing food entries',
    'start-date-label': 'Start Date:',
    'end-date-label': 'End Date:',
    'load-stats-button': 'Load Stats',
    'avg-calories': 'Average Calories',
    'excluded-dates-title': 'Dates Without Logs (Excluded from calculation)',
    'status-header': 'Status',
    
    // Water tracker
    'water-intake-button': 'Water Intake',
    'half-cup-button': 'Half-cup (125ml)',
    'one-cup-button': 'One Cup (250ml)',
    'one-bottle-button': 'One Bottle (500ml)',
    'mls-placeholder': 'MLs',
    'log-manual-button': 'Log Manual',
    'water-consumed': 'Daily water consumed',

    // AI chat
    'ai-chat-title': 'Nutrition Assistant',
    'ai-chat-placeholder': 'Ask about food, meals, macros...',
    'ai-chat-send': 'Send',
    'ai-chat-quick-label': 'Auto-generate a recommendation from today\'s log',

    //extra
    'no-entries': 'No entries'
  },
  'el': {
    
    'app-title': 'Ημερολόγιο Διατροφής',
    
    // Auth section
    'login-title': 'Σύνδεση',
    'login-button': 'Σύνδεση',
    'register-title': 'Εγγραφή',
    'register-button': 'Εγγραφή',
    'username-placeholder': 'Όνομα χρήστη',
    'password-placeholder': 'Κωδικός πρόσβασης',
    'no-account-text': 'Δεν έχετε λογαριασμό;',
    'existing-account-text': 'Έχετε ήδη λογαριασμό;',
    'switch-language': 'English',
    
    // Profile setup
    'profile-title': 'Ρυθμίσεις Προφίλ',
    'back-dashboard': '← Πίσω',
    'age-label': 'Ηλικία:',
    'age-placeholder': 'π.χ. 25',
    'gender-label': 'Φύλο:',
    'gender-male': 'Αρσενικό',
    'gender-female': 'Θηλυκό',
    'height-label': 'Ύψος (εκ):',
    'height-placeholder': 'π.χ. 170',
    'current-weight-label': 'Τρέχον Βάρος (kg):',
    'current-weight-placeholder': 'π.χ. 70',
    'goal-weight-label': 'Επιθυμητό Βάρος (kg):',
    'goal-weight-placeholder': 'π.χ. 65',
    'activity-label': 'Επίπεδο Δραστηριότητας:',
    'activity-bmr': 'Βασικός Μεταβολισμός (BMR)',
    'activity-sedentary': 'Καθιστικό (ελάχιστη άσκηση)',
    'activity-light': 'Ελαφριά (άσκηση 1-3 φορές/εβδομάδα)',
    'activity-moderate': 'Μέτρια (άσκηση 4-5 φορές/εβδομάδα)',
    'activity-active': 'Ενεργητικό (καθημερινή άσκηση ή έντονη 3-4 φορές/εβδομάδα)',
    'activity-very-active': 'Πολύ Ενεργητικό (έντονη άσκηση 6-7 φορές/εβδομάδα)',
    'activity-extremely-active': 'Εξαιρετικά Ενεργητικό (πολύ έντονη άσκηση καθημερινά ή σωματική εργασία)',
    'goal-type-label': 'Τύπος Στόχου:',
    'goal-app': 'Αυτόματος Υπολογισμός',
    'goal-custom': 'Προσαρμοσμένοι Στόχοι',
    'custom-calories-label': 'Ημερήσιες Θερμίδες:',
    'custom-carbs-label': 'Υδατάνθρακες (γρ):',
    'custom-protein-label': 'Πρωτεΐνη (γρ):',
    'custom-fat-label': 'Λίπος (γρ):',
    'save-profile': 'Αποθήκευση Προφίλ',
    
    // Dashboard
    'view-date-label': 'Ημερομηνία:',
    'refresh-button': 'Ανανέωση',
    'daily-calories': 'Ημερήσιες Θερμίδες',
    'carbs-label': 'Υδατάνθρακες (γρ)',
    'protein-label': 'Πρωτεΐνη (γρ)',
    'fats-label': 'Λίπος (γρ)',
    'manual-log-title': 'Χειροκίνητη Καταγραφή',
    'calories-placeholder': 'Θερμίδες',
    'carbs-placeholder': 'Υδατάνθρακες (γρ)',
    'protein-placeholder': 'Πρωτεΐνη (γρ)',
    'fats-placeholder': 'Λίπος (γρ)',
    'add-entry-button': 'Προσθήκη Εγγραφής',
    'food-log-title': 'Καταγραφή Τροφίμων',
    'search-foods-placeholder': 'Αναζήτηση τροφίμων...',
    'grams-placeholder': 'Γραμμάρια',
    'add-food-button': 'Προσθήκη Τροφής',
    
    // Settings drawer
    'profile-button': 'Προφίλ',
    'meal-history-button': 'Ιστορικό Γευμάτων',
    'weight-tracker-button': 'Παρακολούθηση Βάρους',
    'custom-foods-button': 'Προσαρμοσμένα Τρόφιμα',
    'stats-button': 'Ιστορικά Στατιστικά',
    'language-button': 'Αλλαγή σε Αγγλικά',
    'logout-button': 'Αποσύνδεση',
    
    // Custom foods
    'custom-foods-title': 'Προσαρμοσμένα Τρόφιμα',
    'food-name-placeholder': 'Όνομα Τροφής',
    'calories-100g': 'Θερμίδες/100γρ',
    'carbs-100g': 'Υδατ/100γρ',
    'protein-100g': 'Πρωτεΐνη/100γρ',
    'fats-100g': 'Λίπος/100γρ',
    'save-food-button': 'Αποθήκευση Τροφής',
    
    // Meal history
    'meal-history-title': 'Ιστορικό Γευμάτων',
    'load-logs-button': 'Φόρτωση Εγγραφών',
    'manual-entry': 'Χειροκίνητη Καταγραφή',
    'calories-label': 'Θερμίδες',
    'carbs-label': 'Υδατάνθρακες',
    'protein-label': 'Πρωτεΐνη',
    'fats-label': 'Λίπος',
    'delete-button': 'Διαγραφή',
    'edit-button': 'Επεξεργασία',
    'all-dates-have-logs': 'Όλες οι ημερομηνίες έχουν καταγραφές',
    'weight-placeholder': 'Βάρος (kg)',
    'search-foods': 'Αναζήτηση τροφίμων',
    
    // Weight tracker
    'weight-progress-title': 'Πρόοδος Βάρους',
    'weight-placeholder': 'Βάρος (kg)',
    'log-weight-button': 'Καταγραφή Βάρους',
    'weight-history-title': 'Ιστορικό Βάρους',
    'date-header': 'Ημερομηνία',
    'weight-header': 'Βάρος (kg)',
    'actions-header': 'Ενέργειες',
    
    // Stats page
    'stats-title': 'Ιστορικά Στατιστικά Διατροφής',
    'stats-description': 'Προβολή μέσων όρων μεταξύ ημερομηνιών. Επιλέξτε εύρος ημερομηνιών για να δείτε:',
    'stats-point1': 'Μέσες ημερήσιες θερμίδες και θρεπτικά συστατικά',
    'stats-point2': 'Ημερομηνίες χωρίς καταγραφές',
    'start-date-label': 'Από:',
    'end-date-label': 'Έως:',
    'load-stats-button': 'Φόρτωση Στατιστικών',
    'avg-calories': 'Μέσες Θερμίδες',
    'excluded-dates-title': 'Ημερομηνίες χωρίς καταγραφές (Εξαιρούνται από υπολογισμούς)',
    'status-header': 'Κατάσταση',
    
    // Water tracker
    'water-intake-button': 'Κατανάλωση Νερού',
    'half-cup-button': 'Μισό Ποτήρι (125ml)',
    'one-cup-button': 'Ένα Ποτήρι (250ml)',
    'one-bottle-button': 'Ένα Μπουκάλι (500ml)',
    'mls-placeholder': 'ml',
    'log-manual-button': 'Χειροκίνητη Καταγραφή',
    'water-consumed': 'Ημερήσια κατανάλωση νερού',

    // AI chat
    'ai-chat-title': 'Βοηθός Διατροφής',
    'ai-chat-placeholder': 'Ρωτήστε για φαγητό, γεύματα, μακροθρεπτικά...',
    'ai-chat-send': 'Αποστολή',
    'ai-chat-quick-label': 'Αυτόματη δημιουργία πρότασης βάσει σημερινής καταγραφής',

    //extra
    'no-entries': 'Δεν υπάρχουν εγγραφές'
  }
};


function toggleLanguage() {
  currentLanguage = currentLanguage === 'en' ? 'el' : 'en';
  localStorage.setItem('nutritionDiaryLang', currentLanguage);
  updateTextElements();
  document.getElementById('language-button').textContent = 
    currentLanguage === 'en' ? 'Switch to Greek' : 'Αλλαγή σε Αγγλικά';
}


function updateTextElements() {
  // Translate regular text
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = translations[currentLanguage][key];
  });

  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = translations[currentLanguage][key]; 
  });
}



  const foodImages = {
    'Chicken Breast': 'images/Chicken_Breast.png',
    'White Cooked Rice': 'images/White_Cooked_Rice.png',
    'Salmon Fillet': 'images/Salmon_Fillet.png',
    'Ground Beef (80/20)': 'images/Ground_Beef.png',
    'Bacon': 'images/Bacon.png',
    'Peanut Butter': 'images/Peanut_Butter.png',
    'Almonds': 'images/Almonds.png',
    'Whole Milk': 'images/Whole_Milk.png',
    'Greek Yogurt': 'images/Greek_Yogurt.png',
    'Cheddar Cheese': 'images/Cheddar_Cheese.png',
    'Eggs': 'images/Eggs.png',
    'Protein Powder': 'images/Protein_Powder.png',
    'Pork Chop': 'images/Pork_Chop.png'
    // add other food names and their corresponding images here 
  };
  




  function initStatsDatePickers() {
    const today = new Date().toISOString().split('T')[0];
    const startDate = document.getElementById('stats-start-date');
    const endDate = document.getElementById('stats-end-date');
    
    startDate.value = today;
    endDate.value = today;
    
    
  }


  
function showStatsPage() {
  hideAllSections();
  document.getElementById('stats-page').style.display = 'block';
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('stats-start-date').value = today;
  document.getElementById('stats-end-date').value = today;
}

async function loadStats() {
  const startDate = document.getElementById('stats-start-date').value;
  const endDate = document.getElementById('stats-end-date').value;

  try {
    // Get all required data in parallel
    const [averages, excluded, goals] = await Promise.all([
      fetch(`http://localhost:3000/stats?user_id=${currentUserId}&start=${startDate}&end=${endDate}`)
        .then(res => res.json()),
      fetch(`http://localhost:3000/excluded-dates?user_id=${currentUserId}&start=${startDate}&end=${endDate}`)
        .then(res => res.json()),
      fetch(`http://localhost:3000/daily-goals?user_id=${currentUserId}`)
        .then(res => res.json())
    ]);

    // Update progress bars with actual goals
    updateAverageProgress('calories', averages.avgCalories, goals.daily_calories);
    updateAverageProgress('carbs', averages.avgCarbs, goals.carbs);
    updateAverageProgress('protein', averages.avgProtein, goals.protein);
    updateAverageProgress('fats', averages.avgFats, goals.fat);

    // Update excluded dates
    const excludedList = document.getElementById('excluded-dates-list');
if (excluded.dates.length === 0) {
  excludedList.innerHTML = `<tr><td colspan="2">All dates in range have logs</td></tr>`;
} else {
  excludedList.innerHTML = excluded.dates.map(date => 
    `<tr><td>${date}</td><td>${translations[currentLanguage]['no-entries']}</td></tr>`
  ).join('');
}

  } catch (error) {
    alert('Error loading stats: ' + error.message);
  }
}

function updateAverageProgress(type, avgValue, goal) {
  const bar = document.getElementById(`avg-${type}-bar`);
  const info = document.getElementById(`avg-${type}-info`);
  
  // Handle division by zero and NaN cases
  const progress = goal > 0 ? (avgValue / goal) * 100 : 0;
  
  bar.style.width = `${Math.min(progress, 100)}%`;
  info.textContent = `${Math.round(avgValue || 0)} / ${goal}`;
  
  // Color coding
  if(progress < 90) {
    bar.style.backgroundColor = '#4CAF50';
  } else if(progress <= 100) {
    bar.style.backgroundColor = '#FF9800';
  } else {
    bar.style.backgroundColor = '#F44336';
  }
}




  function loadCustomFoods() {
    fetch(`http://localhost:3000/custom-foods?user_id=${currentUserId}`)
      .then(response => response.json())
      .then(foods => {
        const container = document.getElementById('custom-foods-list');
        container.innerHTML = foods.map(food => `
          <div class="food-item">
            <div class="food-info">
              <h3>${food.name}</h3>
              <p>${food.calories} kcal | C:${food.carbs}g P:${food.protein}g F:${food.fats}g</p>
            </div>
            <div class="food-actions">
              <button onclick="editCustomFood('${food.id}', '${food.name}', ${food.calories}, ${food.carbs}, ${food.protein}, ${food.fats})">${translations[currentLanguage]['edit-button']}</button>
              <button onclick="deleteCustomFood('${food.id}')">${translations[currentLanguage]['delete-button']}</button>
            </div>
          </div>
        `).join('');
      });
  }


  function editCustomFood(id, name, calories, carbs, protein, fats) {
    editingFoodId = id;
    document.getElementById('custom-food-name').value = name;
    document.getElementById('custom-food-calories').value = calories;
    document.getElementById('custom-food-carbs').value = carbs;
    document.getElementById('custom-food-protein').value = protein;
    document.getElementById('custom-food-fats').value = fats;
  }
  
  function deleteCustomFood(id) {
    if (confirm('Delete this food?')) {
      fetch(`http://localhost:3000/custom-food/${id}?user_id=${currentUserId}`, { 
        method: 'DELETE' 
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to delete');
        loadCustomFoods(); // Refresh the list only if successful
      })
      .catch(error => alert(error.message)); // Show error message
    }
  }



  
function hideAllSections() {
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('meal-history').style.display = 'none';
  document.getElementById('weight-tracker').style.display = 'none';
  document.getElementById('profile-setup').style.display = 'none';
  document.getElementById('settings-drawer').style.display = 'none';
  document.getElementById('custom-foods').style.display = 'none';
  document.getElementById('stats-page').style.display = 'none';
}


  //global functions for water tracking
function toggleWaterControls() {
  const controls = document.getElementById('water-controls');
  controls.style.display = controls.style.display === 'flex' ? 'none' : 'flex';
}

function logWater(amount) {
  const date = document.getElementById('view-date').value;
  fetch('http://localhost:3000/water-log', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      user_id: currentUserId,
      date: date,
      amount: amount
    })
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to log water');
    updateWaterTotal();
  })
  .catch(error => alert(error.message));
}

function logManualWater() {
  const amount = parseInt(document.getElementById('manual-water').value);
  if (isNaN(amount)) {
    alert('Please enter a valid amount');
    return;
  }
  logWater(amount);
  document.getElementById('manual-water').value = '';
}

function updateWaterTotal() {
  const date = document.getElementById('view-date').value;
  fetch(`http://localhost:3000/water-total?user_id=${currentUserId}&date=${date}`)
    .then(response => response.json())
    .then(data => {
      document.getElementById('water-ml').textContent = `${data.total || 0} ml`;
    });
}





  function deleteLogEntry(logId) {
    fetch(`http://localhost:3000/food-log/${logId}`, { 
      method: 'DELETE' 
    })
    .then(response => {
      if (!response.ok) throw new Error('Failed to delete');
      loadMealHistory(); // Refresh the list
      updateDashboard(); // Refresh main page stats
    })
    .catch(error => alert(error.message));
  }

  function showEditLogForm(logId) {
    // Remove existing edit forms
    document.querySelectorAll('.edit-log-form').forEach(form => form.remove());

    fetch(`http://localhost:3000/food-log/${logId}`)
      .then(response => response.json())
      .then(log => {
        const form = document.createElement('form');
        form.className = 'edit-log-form';
        form.innerHTML = `
          <h3>Edit Log</h3>
          <input type="number" id="edit-calories" value="${log.calories}" placeholder="Calories" required>
          <input type="number" id="edit-carbs" value="${log.carbs}" placeholder="Carbs (g)" required>
          <input type="number" id="edit-protein" value="${log.protein}" placeholder="Protein (g)" required>
          <input type="number" id="edit-fats" value="${log.fats}" placeholder="Fats (g)" required>
          <button type="button" onclick="submitEdit(${log.id})">Save</button>
          <button type="button" onclick="this.parentElement.remove()">Cancel</button>
        `;
        document.getElementById('meal-log-entries').prepend(form);
      });
  }

  function submitEdit(logId) {
    const updatedLog = {
      calories: parseInt(document.getElementById('edit-calories').value),
      carbs: parseInt(document.getElementById('edit-carbs').value),
      protein: parseInt(document.getElementById('edit-protein').value),
      fats: parseInt(document.getElementById('edit-fats').value)
    };

    fetch(`http://localhost:3000/food-log/${logId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedLog)
    })
    .then(response => {
      if (!response.ok) throw new Error('Update failed');
      loadMealHistory(); // Refresh the list
      updateDashboard(); // Sync main page
    })
    .catch(error => alert(error.message));
  }




function loadMealHistory() {
  const date = document.getElementById('history-date').value;
  fetch(`http://localhost:3000/food-logs?user_id=${currentUserId}&date=${date}`)
    .then(response => response.json())
    .then(logs => {
      const container = document.getElementById('meal-log-entries');
      container.innerHTML = '';
      
      logs.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'meal-log-entry';
        
       // Update the foodInfo line in loadMealHistory
            let foodInfo = '';
            if (log.food_item_id) {
              foodInfo = ` (${log.grams}g)`;  
            }

            entry.innerHTML = `
            <div class="meal-log-details">
              <p>
                ${log.date} - 
                ${log.food_name ? log.food_name + foodInfo : translations[currentLanguage]['manual-entry']}
                <br>
                ${translations[currentLanguage]['calories-label']}: ${Math.round(log.calories)},
                ${translations[currentLanguage]['carbs-label']}: ${Math.round(log.carbs)}g,
                ${translations[currentLanguage]['protein-label']}: ${Math.round(log.protein)}g,
                ${translations[currentLanguage]['fats-label']}: ${Math.round(log.fats)}g
              </p>
            </div>
            <div class="meal-log-actions">
              ${log.food_item_id ? `
                <button onclick="showFoodEditForm(${log.id}, ${log.grams})">
                  ${translations[currentLanguage]['edit-button']}
                </button>
              ` : `
                <button onclick="showEditLogForm(${log.id})">
                  ${translations[currentLanguage]['edit-button']}
                </button>
              `}
              <button onclick="deleteLogEntry(${log.id})">
                ${translations[currentLanguage]['delete-button']}
              </button>
            </div>
          `;
        container.appendChild(entry);
      });
    });
}
  




// Food Search Implementation
let currentFoodSelection = null;

document.getElementById('food-search').addEventListener('input', async (e) => {
  const search = e.target.value;
  const resultsContainer = document.getElementById('food-results');
  
  if (search.length > 2) {
    const response = await fetch(
      `http://localhost:3000/food-items?search=${encodeURIComponent(search)}&user_id=${currentUserId}`
    );
    const foods = await response.json();
    
    resultsContainer.innerHTML = foods.map(food => {
      const imgSrc = foodImages[food.name] || 'images/default.png';
      return `
        <div class="food-result-item" data-id="${food.id}">
          <img src="${imgSrc}" alt="${food.name} icon" class="food-icon">
          ${food.name}
        </div>
      `;
    }).join('');
    
    
    document.querySelectorAll('.food-result-item').forEach(item => {
      item.addEventListener('click', () => {
        currentFoodSelection = foods.find(f => f.id == item.dataset.id);
        
        
        const searchInput = document.getElementById('food-search');
        searchInput.value = currentFoodSelection.name;
        
        document.getElementById('food-grams').style.display = 'block';
        document.querySelector('button[onclick="logFood()"]').style.display = 'block';
        resultsContainer.innerHTML = '';
      });
    });
  }
});

// Log Food Function
function logFood() {
  const grams = parseFloat(document.getElementById('food-grams').value);
  const date = document.getElementById("view-date").value;

  if (!currentFoodSelection || !grams) {
    alert('Please select a food and enter grams');
    return;
  }

  fetch('http://localhost:3000/food-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: currentUserId,
      date,
      food_item_id: currentFoodSelection.id,
      grams
    })
  }).then(response => {
    if (response.ok) {
      document.getElementById('food-search').value = '';
      document.getElementById('food-grams').value = '';
      document.getElementById('food-results').innerHTML = '';
      
      updateDashboard();
      currentFoodSelection = null;
    }
  });
}
  



// Food-specific edit form
function showFoodEditForm(logId, currentGrams) {
  const form = document.createElement('form');
  form.className = 'edit-log-form';
  form.innerHTML = `
    <h3>Edit Food Quantity</h3>
    <input type="number" id="edit-grams" value="${currentGrams}" step="1" required>
    <button type="button" onclick="submitFoodEdit(${logId})">Save</button>
    <button type="button" onclick="this.parentElement.remove()">Cancel</button>
  `;
  document.getElementById('meal-log-entries').prepend(form);
}

function submitFoodEdit(logId) {
  const gramsInput = document.getElementById('edit-grams');
  const grams = parseFloat(gramsInput.value);
  
  if (isNaN(grams)) {
    alert('Please enter a valid number for grams');
    return;
  }

  fetch(`http://localhost:3000/food-log/${logId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grams })
  }).then(response => {
    if (response.ok) {
      loadMealHistory();
      updateDashboard();
    } else {
      response.json().then(data => alert(data.error || 'Update failed'));
    }
  });
}





  
function showDashboard() {
  hideAllSections();
  showPage('dashboard');
  updateDashboard();
}




function showPage(pageId) {
  // Hide ALL sections first
  hideAllSections();
  
  // Show requested page
  if (pageId) {
    document.getElementById(pageId).style.display = 'block';
  }

  // Water tracker visibility
  const waterTracker = document.getElementById('water-tracker');
  const shouldShowWater = (
    pageId === 'dashboard' && 
    currentUserId !== null &&
    document.getElementById('auth-section').style.display === 'none'
  );
  
  waterTracker.style.display = shouldShowWater ? 'block' : 'none';
  
  // Auto remove the blur and settings drawer active classes if present
  const drawer = document.getElementById('settings-drawer');
  const overlay = document.querySelector('.settings-overlay');
  if (drawer.classList.contains('active')) {
    drawer.classList.remove('active');
  }
  if (overlay.classList.contains('active')) {
    overlay.classList.remove('active');
  }
}


// global variable
let weightChart = null;


function logWeight() {
  const date = document.getElementById('weight-date').value;
  const weight = parseFloat(document.getElementById('weight-input').value);

  // validation
  if (!date || isNaN(weight)) {
    alert('Please fill all fields with valid values');
    return;
  }

  fetch('http://localhost:3000/weight-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: currentUserId,
      date: date,
      weight: weight
    })
  })
  .then(response => {
    if (!response.ok) return response.json().then(err => { throw new Error(err.error) });
    loadWeightData();
    document.getElementById('weight-input').value = '';
  })
  .catch(error => {
    console.error("Weight log error:", error);
    alert("Failed to save entry: " + error.message); // More specific error
  });
}

function loadWeightData() {
  fetch(`http://localhost:3000/weight-logs?user_id=${currentUserId}`)
    .then(response => response.json())
    .then(logs => {
      updateWeightChart(logs);
      displayWeightEntries(logs);
    });
}

function updateWeightChart(logs) {
  const ctx = document.getElementById('weight-chart').getContext('2d');
  const dates = logs.map(log => log.date);
  const weights = logs.map(log => log.weight);
  
  if (weightChart) weightChart.destroy();

  weightChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [{
        label: 'Weight (kg)',
        data: weights,
        borderColor: '#4ADE80',
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: '#444' },
          ticks: { color: '#e0e0e0' }
        },
        x: {
          grid: { color: '#444' },
          ticks: { color: '#e0e0e0' }
        }
      },
      plugins: {
        legend: { labels: { color: '#e0e0e0' } }
      }
    }
  });
}

// Update the displayWeightEntries function in script.js:
function displayWeightEntries(logs) {
  const container = document.getElementById('weight-log-entries');
  container.innerHTML = logs.map(log => `
    <tr>
      <td>${log.date}</td>
      <td>${log.weight.toFixed(1)} kg</td>
      <td>
        <button class="delete-weight-btn" onclick="deleteWeightEntry(${log.id})" data-i18n="delete-button">Delete</button>
      </td>
    </tr>
  `).join('');
}


// Add delete function
function deleteWeightEntry(logId) {
  if (!confirm('Are you sure you want to delete this entry?')) return;
  
  fetch(`http://localhost:3000/weight-log/${logId}`, {
    method: 'DELETE'
  })
  .then(response => {
    if (!response.ok) throw new Error('Failed to delete');
    loadWeightData();
  })
  .catch(error => alert(error.message));
}





  // Initialize date picker
  function initDatePicker() {
    const dateInput = document.getElementById("view-date");
    dateInput.value = new Date().toISOString().split('T')[0];
    dateInput.addEventListener('change', updateDashboard);
  }

  // Update dashboard data
  function updateDashboard() {
    const dateInput = document.getElementById("view-date");
    const selectedDate = dateInput.value;

    // Show loading states
    document.getElementById("calories-info").textContent = "Loading...";
    document.getElementById("carbs-info").textContent = "Loading...";
    document.getElementById("protein-info").textContent = "Loading...";
    document.getElementById("fats-info").textContent = "Loading...";

    Promise.all([
      fetch(`http://localhost:3000/daily-totals?user_id=${currentUserId}&date=${selectedDate}`),
      fetch(`http://localhost:3000/daily-goals?user_id=${currentUserId}`)
    ])
    .then(([totalsRes, goalsRes]) => Promise.all([totalsRes.json(), goalsRes.json()]))
    .then(([totals, goals]) => {

      const currentWeight = parseFloat(goals.current_weight) || 0;
      const goalWeight = parseFloat(goals.goal_weight) || 0;


      const calories = totals.totalCalories || 0;
      const carbs = totals.totalCarbs || 0;
      const protein = totals.totalProtein || 0;
      const fats = totals.totalFats || 0;

      // Determine which goals to display
      const displayGoals = goals.goal_type === 'custom' ? {
        dailyCalories: goals.custom_calories,
        carbs: goals.custom_carbs,
        protein: goals.custom_protein,
        fat: goals.custom_fat
      } : {
        dailyCalories: goals.daily_calories, 
        carbs: goals.carbs,
        protein: goals.protein,
        fat: goals.fat
      };

      document.getElementById("calories-info").textContent = `${calories} / ${displayGoals.dailyCalories || 0}`;
    document.getElementById("carbs-info").textContent =  `${carbs} / ${displayGoals.carbs || 0}`;
    document.getElementById("protein-info").textContent = `${protein} / ${displayGoals.protein || 0}`;
    document.getElementById("fats-info").textContent =  `${fats} / ${displayGoals.fat || 0}`;

    updateProgressBar('calories-bar', calories, displayGoals.dailyCalories, currentWeight, goalWeight);
      updateProgressBar('carbs-bar', carbs, displayGoals.carbs);
      updateProgressBar('protein-bar', protein, displayGoals.protein);
      updateProgressBar('fats-bar', fats, displayGoals.fat);
    })
    .catch(error => {
      console.error("Update error:", error);
      document.getElementById("calories-info").textContent = "0 / 0";
      document.getElementById("carbs-info").textContent = "0 / 0";
      document.getElementById("protein-info").textContent = "0 / 0";
      document.getElementById("fats-info").textContent = "0 / 0";
    });

    updateWaterTotal();
}


function updateProgressBar(elementId, consumed, goal, currentWeight, goalWeight) {
  let progress = (consumed / goal) * 100 || 0;
  const cappedProgress = Math.min(progress, 150);
  const bar = document.getElementById(elementId);
  bar.style.width = `${cappedProgress}%`;

  if (elementId === 'calories-bar') {
    let color = '#F44336'; // Default red
    currentWeight = parseFloat(currentWeight) || 0;
    goalWeight = parseFloat(goalWeight) || 0;

    if (currentWeight > goalWeight) {
      // Lose weight: green if <= goal-300, orange if <= goal, else red
      if (consumed <= goal - 300) color = '#4CAF50';
      else if (consumed <= goal) color = '#FF9800';
    } else if (currentWeight < goalWeight) {
      // Gain weight: green if >= goal+300, orange if >= goal, else red
      if (consumed >= goal + 300) color = '#4CAF50';
      else if (consumed >= goal) color = '#FF9800';
    } else {
      // Maintain: green if within ±150, orange if within ±300
      const diff = Math.abs(consumed - goal);
      if (diff <= 150) color = '#4CAF50';
      else if (diff <= 300) color = '#FF9800';
    }
    bar.style.backgroundColor = color;
  } else {
    // macro logic
    if (consumed <= goal - 300) bar.style.backgroundColor = '#4CAF50';
    else if (consumed <= goal) bar.style.backgroundColor = '#FF9800';
    else bar.style.backgroundColor = '#F44336';
  }
}

  // Helper functions
  function handleResponse(response) {
    if (!response.ok) {
      return response.json().then(data => { throw new Error(data.error || "Request failed"); });
    }
    return response.json();
  }

  function handleError(element, isProfile = false) {
    return error => {
      if (isProfile) {
        element.style.color = "red";
        element.textContent = error.message;
      } else {
        element.textContent = error.message;
      }
      console.error(error);
    };
  }

  //AI chatbot related stuff start below here
  function toggleAiChat() {
    document.getElementById('ai-chat-panel').classList.toggle('active');
  }

  function addChatMessage(role, text) {
    const messagesEl = document.getElementById('ai-chat-messages');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;

    if (role === 'ai') {
      bubble.innerHTML = DOMPurify.sanitize(marked.parse(text));
    } else {
      bubble.textContent = text;
    }

    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setChatLoading(isLoading) {
    document.getElementById('ai-chat-typing').style.display = isLoading ? 'flex' : 'none';
    document.getElementById('ai-chat-send').disabled = isLoading;
    document.getElementById('ai-chat-quick').disabled = isLoading;
  }

  async function askAi(userMessage) {
    setChatLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/chat/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUserId,
          message: userMessage || null
        })
      });
      const data = await response.json();
      setChatLoading(false);

      if (data.error) {
        addChatMessage('ai', 'Sorry, something went wrong. Please try again.');
        return;
      }
      addChatMessage('ai', data.recommendation);
    } catch (err) {
      setChatLoading(false);
      addChatMessage('ai', 'Sorry, I could not reach the assistant right now.');
      console.error('AI chat error:', err);
    }
  }

  function getAiRecommendation() {
    addChatMessage('user', 'Give me a recommendation based on today\'s log');
    askAi(null);
  }

  document.getElementById('ai-chat-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const input = document.getElementById('ai-chat-input');
    const text = input.value.trim();
    if (!text) return;

    addChatMessage('user', text);
    input.value = '';
    askAi(text);
  });

 function clearAiChat() {
  document.getElementById('ai-chat-messages').innerHTML = '';
}