const bcrypt = require('bcrypt');
const saltRounds = 10; 


const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { 
  db, 
  registerUser, 
  findUserByUsername, 
  insertFoodLog, 
  updateUserProfile,
  getDailyTotals,
  getSevenDayAverages,
  deleteFoodLog , 
  insertWeightLog, 
  getWeightLogs 
} = require('./database.js');

const { calculateDailyGoals } = require('./utils.js');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('frontend'));

// Routes
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Hash the password
  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error('Error hashing password:', err);
      return res.status(500).json({ error: 'Server error during registration' });
    }

    registerUser(username, hashedPassword, (err, userId) => {
      if (err) return res.status(400).json({ error: err.message });
      res.status(201).json({ message: 'User registered successfully', userId });
    });
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  findUserByUsername(username, (err, user) => {
    if (err) return res.status(500).json({ error: 'Server error' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Compare provided password with stored hashed password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords:', err);
        return res.status(500).json({ error: 'Server error during login' });
      }
      if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

      res.status(200).json({ message: 'Login successful', userId: user.user_id });
    });
  });
});

// In server.js, modify the POST /food-log endpoint
app.post('/food-log', (req, res) => {
  const { user_id, date, food_item_id, grams } = req.body;

  if (food_item_id) {
    // First check custom foods
    db.get('SELECT * FROM user_foods WHERE id = ? AND user_id = ?', 
      [food_item_id, user_id], (err, userFood) => {
        if (userFood) {
          // Calculate from custom food
          const nutrients = {
            calories: (userFood.calories * grams) / 100,
            carbs: (userFood.carbs * grams) / 100,
            protein: (userFood.protein * grams) / 100,
            fats: (userFood.fats * grams) / 100
          };
          return insertFoodLog(user_id, date, nutrients.calories, nutrients.carbs, 
            nutrients.protein, nutrients.fats, food_item_id, grams, () => res.status(201).json({ message: 'Custom food logged' }));
        }

        // Fallback to pre-made foods
        db.get('SELECT * FROM food_items WHERE id = ?', [food_item_id], (err, foodItem) => {
          if (err || !foodItem) return res.status(400).json({ error: 'Invalid food item' });
          
          const nutrients = {
            calories: (foodItem.calories_per_100g * grams) / 100,
            carbs: (foodItem.carbs_per_100g * grams) / 100,
            protein: (foodItem.protein_per_100g * grams) / 100,
            fats: (foodItem.fats_per_100g * grams) / 100
          };
          insertFoodLog(user_id, date, nutrients.calories, nutrients.carbs, 
            nutrients.protein, nutrients.fats, food_item_id, grams, (err) => {
              if (err) return res.status(500).json({ error: 'Error logging food' });
              res.status(201).json({ message: 'Food logged successfully' });
            });
        });
      });
  } else {
    // Existing manual entry handling
    const { calories, carbs, protein, fats } = req.body;
    insertFoodLog(user_id, date, calories, carbs, protein, fats, null, null, (err) => {
      if (err) return res.status(500).json({ error: 'Error logging food' });
      res.status(201).json({ message: 'Manual entry logged' });
    });
  }
});




// Modify the GET /food-logs endpoint
app.get('/food-logs', (req, res) => {
  const { user_id, date } = req.query;
  if (!user_id || !date) return res.status(400).json({ error: "Missing parameters" });

  db.all(
    `SELECT food_logs.*, food_items.name as food_name 
     FROM food_logs 
     LEFT JOIN food_items ON food_logs.food_item_id = food_items.id
     WHERE user_id = ? AND date = ?`,
    [user_id, date],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.status(200).json(rows);
    }
  );
});



app.get('/seven-day-averages', (req, res) => {
  const { user_id, endDate } = req.query;
  if (!user_id || !endDate) {
    return res.status(400).json({ error: "user_id and endDate are required" });
  }

  getSevenDayAverages(user_id, endDate, (err, averages) => {
    if (err) return res.status(500).json({ error: "Error retrieving 7-day averages" });
    res.status(200).json(averages);
  });
});

app.delete('/food-log/:id', (req, res) => {
  const { id } = req.params;
  deleteFoodLog(id, (err, result) => {
    if (err) return res.status(500).json({ error: "Error deleting food log entry" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Food log entry not found" });
    res.status(200).json({ message: "Food log entry deleted successfully" });
  });
});

// update-profile endpoint
app.post('/update-profile', (req, res) => {
  const { 
    user_id, age, height, current_weight, goal_weight, activity_level, gender,
    goal_type, custom_calories, custom_carbs, custom_protein, custom_fat
  } = req.body;

  let goals;
  let finalCustomCalories = custom_calories;
  let finalCustomCarbs = custom_carbs;
  let finalCustomProtein = custom_protein;
  let finalCustomFat = custom_fat;

  if (goal_type === 'app') {
    // Calculate goals and NULLIFY custom fields
    const genderText = gender === 0 ? "male" : "female";
    goals = calculateDailyGoals({
      age, height, weight: current_weight, goalWeight: goal_weight,
      activityLevel: activity_level, gender: genderText
    });
    // Explicitly set custom fields to null
    finalCustomCalories = null;
    finalCustomCarbs = null;
    finalCustomProtein = null;
    finalCustomFat = null;
  } else {
    // Use custom values directly
    goals = {
      dailyCalories: custom_calories,
      carbs: custom_carbs,
      protein: custom_protein,
      fat: custom_fat
    };
  }

  updateUserProfile(
    user_id,
    age,
    height,
    current_weight,
    goal_weight,
    activity_level,
    gender,
    goals.dailyCalories,
    goals.carbs,
    goals.protein,
    goals.fat,
    goal_type,
    finalCustomCalories, // Use nullified values
    finalCustomCarbs,
    finalCustomProtein,
    finalCustomFat,
    (err, result) => {
      if (err) {
        console.error("Profile update error:", err);
        return res.status(500).json({ error: "Error updating profile" });
      }
      res.status(200).json({ 
        message: "Profile updated successfully",
        goals: goals
      });
    }
  );
});
    

// update the daily-goals endpoint
app.get('/daily-goals', (req, res) => {
  const { user_id } = req.query;
  db.get(
    `SELECT 
      daily_calories, carbs, protein, fat, 
      goal_type, custom_calories, custom_carbs, custom_protein, custom_fat,
      current_weight, goal_weight 
     FROM users WHERE user_id = ?`,
    [user_id],
    (err, row) => {
      if (err) return res.status(500).json({ error: "Database error" });
      // Handle null values for new columns
      const goals = row ? {
        ...row,
        goal_type: row.goal_type || 'app',
        custom_calories: row.custom_calories || 0,
        custom_carbs: row.custom_carbs || 0,
        custom_protein: row.custom_protein || 0,
        custom_fat: row.custom_fat || 0
      } : {};
      res.status(200).json(goals);
    }
  );
});

app.get('/daily-totals', (req, res) => {
  const { user_id, date } = req.query;
  getDailyTotals(user_id, date, (err, totals) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.status(200).json({
      totalCalories: totals?.totalCalories || 0,
      totalCarbs: totals?.totalCarbs || 0,
      totalProtein: totals?.totalProtein || 0,
      totalFats: totals?.totalFats || 0
    });
  });
});




app.put('/food-log/:id', (req, res) => {
  const { id } = req.params;
  const { grams } = req.body;

  // Get existing log
  db.get('SELECT * FROM food_logs WHERE id = ?', [id], (err, log) => {
    if (err || !log) return res.status(404).json({ error: 'Log not found' });

    if (log.food_item_id) {
      // Recalculate nutrients if it's a food item log
      db.get('SELECT * FROM food_items WHERE id = ?', [log.food_item_id], (err, foodItem) => {
        const nutrients = {
          calories: (foodItem.calories_per_100g * grams) / 100,
          carbs: (foodItem.carbs_per_100g * grams) / 100,
          protein: (foodItem.protein_per_100g * grams) / 100,
          fats: (foodItem.fats_per_100g * grams) / 100
        };

        db.run(`UPDATE food_logs SET 
          grams = ?,
          calories = ?,
          carbs = ?,
          protein = ?,
          fats = ?
          WHERE id = ?`,
          [grams, nutrients.calories, nutrients.carbs, 
           nutrients.protein, nutrients.fats, id],
          function(err) {
            if (err) return res.status(500).json({ error: 'Update failed' });
            res.status(200).json({ message: 'Updated successfully' });
          });
      });
    } else {
      // Existing manual log update
      const { calories, carbs, protein, fats } = req.body;
      db.run(`UPDATE food_logs SET 
        calories = ?,
        carbs = ?,
        protein = ?,
        fats = ?
        WHERE id = ?`,
        [calories, carbs, protein, fats, id],
        function(err) {
          if (err) return res.status(500).json({ error: 'Update failed' });
          res.status(200).json({ message: 'Updated successfully' });
        });
    }
  });
});







// Add route to get single log entry
app.get('/food-log/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM food_logs WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json(row);
  });
});





app.post('/weight-log', (req, res) => {
  const { user_id, date, weight } = req.body;
  console.log('Received weight log:', req.body); 
  
  if (!user_id || !date || !weight) {
    console.error('Missing fields:', { user_id, date, weight });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  insertWeightLog(user_id, date, weight, (err) => {
    if (err) {
      console.error('Weight log error:', err);
      return res.status(500).json({ error: 'Error logging weight: ' + err.message });
    }
    res.status(201).json({ message: 'Weight logged successfully' });
  });
});







app.get('/weight-logs', (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "user_id required" });

  getWeightLogs(user_id, (err, logs) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.status(200).json(logs);
  });
});








app.post('/water-log', (req, res) => {
  const { user_id, date, amount } = req.body;
  if (!user_id || !date || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'INSERT INTO water_logs (user_id, date, amount) VALUES (?, ?, ?)',
    [user_id, date, amount],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(201).json({ message: 'Water logged successfully' });
    }
  );
});

app.get('/water-total', (req, res) => {
  const { user_id, date } = req.query;
  db.get(
    'SELECT SUM(amount) AS total FROM water_logs WHERE user_id = ? AND date = ?',
    [user_id, date],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(200).json({ total: row?.total || 0 });
    }
  );
});









app.delete('/weight-log/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM weight_logs WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(200).json({ message: 'Weight log deleted', changes: this.changes });
  });
});




// Get food items for autocomplete
app.get('/food-items', (req, res) => {
  const { search, user_id } = req.query;
  let params = [];
  
  // Base query for global foods
  let globalQuery = `
    SELECT 
      id, 
      name, 
      calories_per_100g AS calories,
      carbs_per_100g AS carbs,
      protein_per_100g AS protein,
      fats_per_100g AS fats
    FROM food_items 
  `;

  // Base query for custom foods
  let customQuery = `
    SELECT 
      id,
      name,
      calories,
      carbs,
      protein,
      fats
    FROM user_foods 
    WHERE user_id = ?
  `;

  // Add search condition if needed
  if (search) {
    globalQuery += ' WHERE name LIKE ?';
    customQuery += ' AND name LIKE ?';
    params.push(`%${search}%`);
  }

  // Execute both queries in parallel
  Promise.all([
    new Promise((resolve, reject) => {
      db.all(globalQuery, params.filter(p => typeof p === 'string'), (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }),
    new Promise((resolve, reject) => {
      db.all(customQuery, [user_id, ...params], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    })
  ])
  .then(([globalFoods, customFoods]) => {
    // Combine and send results
    res.json([...globalFoods, ...customFoods]);
  })
  .catch(err => {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  });
});




// Custom Food Endpoints
app.post('/custom-food', (req, res) => {
  const { user_id, name, calories, carbs, protein, fats } = req.body;
  db.run(
    'INSERT INTO user_foods (user_id, name, calories, carbs, protein, fats) VALUES (?, ?, ?, ?, ?, ?)',
    [user_id, name, calories, carbs, protein, fats],
    function(err) {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.get('/custom-foods', (req, res) => {
  const { user_id } = req.query;
  db.all(
    'SELECT * FROM user_foods WHERE user_id = ? ORDER BY name COLLATE NOCASE',
    [user_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json(rows);
    }
  );
});

app.put('/custom-food/:id', (req, res) => {
  const { name, calories, carbs, protein, fats } = req.body;
  db.run(
    'UPDATE user_foods SET name=?, calories=?, carbs=?, protein=?, fats=? WHERE id=?',
    [name, calories, carbs, protein, fats, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Update failed' });
      res.json({ message: 'Food updated' });
    }
  );
});

app.delete('/custom-food/:id', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;
  db.run(
    'DELETE FROM user_foods WHERE id=? AND user_id=?',
    [id, user_id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Delete failed' });
      if (this.changes === 0) return res.status(404).json({ error: 'Food not found' });
      res.json({ message: 'Food deleted' });
    }
  );
});



// New endpoints
app.get('/stats', (req, res) => {
  const { user_id, start, end } = req.query;
  const sql = `
    SELECT 
      AVG(totalCalories) AS avgCalories,
      AVG(totalCarbs) AS avgCarbs,
      AVG(totalProtein) AS avgProtein,
      AVG(totalFats) AS avgFats
    FROM (
      SELECT 
        date,
        SUM(calories) AS totalCalories,
        SUM(carbs) AS totalCarbs,
        SUM(protein) AS totalProtein,
        SUM(fats) AS totalFats
      FROM food_logs
      WHERE user_id = ? AND date BETWEEN ? AND ?
      GROUP BY date
      HAVING totalCalories > 0 OR totalCarbs > 0 OR totalProtein > 0 OR totalFats > 0
    )`;
  
  db.get(sql, [user_id, start, end], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(row || { avgCalories: 0, avgCarbs: 0, avgProtein: 0, avgFats: 0 });
  });
});

app.get('/excluded-dates', (req, res) => {
  const { user_id, start, end } = req.query;
  const sql = `
    WITH RECURSIVE dates(date) AS (
      VALUES(?)
      UNION ALL
      SELECT date(date, '+1 day')
      FROM dates
      WHERE date < ?
    )
    SELECT d.date
    FROM dates d
    LEFT JOIN food_logs fl 
      ON d.date = fl.date AND fl.user_id = ?
    WHERE fl.date IS NULL
    UNION
    SELECT date FROM (
      SELECT date, 
        SUM(calories) + SUM(carbs) + SUM(protein) + SUM(fats) AS total
      FROM food_logs
      WHERE user_id = ? AND date BETWEEN ? AND ?
      GROUP BY date
    ) WHERE total = 0
  `;
  
  db.all(sql, [start, end, user_id, user_id, start, end], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ dates: rows.map(r => r.date) });
  });
});


app.get('/user-profile', (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "user_id required" });

  db.get(
    `SELECT age, height, current_weight AS currentWeight, 
     goal_weight AS goalWeight, activity_level AS activityLevel, gender 
     FROM users WHERE user_id = ?`,
    [user_id],
    (err, row) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.status(200).json(row || {});
    }
  );
});


// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});



//AI chatbot feature related stuff start from here and below
require('dotenv').config();

app.post('/api/chat/recommend', (req, res) => {
  const { user_id } = req.body;
  const today = new Date().toISOString().split('T')[0]; // e.g. "2026-08-03"

  if (!user_id) {
    return res.status(400).json({ error: 'user_id required' });
  }

  // Step 1: get the user's profile + goals
  db.get(
    `SELECT age, height, current_weight, goal_weight, activity_level, gender,
            daily_calories, carbs, protein, fat,
            goal_type, custom_calories, custom_carbs, custom_protein, custom_fat
     FROM users WHERE user_id = ?`,
    [user_id],
    (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error fetching user' });
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Step 2: get today's totals so far
      getDailyTotals(user_id, today, (err, totals) => {
        if (err) return res.status(500).json({ error: 'Database error fetching totals' });

        // Step 3: figure out which goal numbers actually apply
        const goalCalories = user.goal_type === 'custom' ? user.custom_calories : user.daily_calories;
        const goalCarbs = user.goal_type === 'custom' ? user.custom_carbs : user.carbs;
        const goalProtein = user.goal_type === 'custom' ? user.custom_protein : user.protein;
        const goalFat = user.goal_type === 'custom' ? user.custom_fat : user.fat;

        const eaten = {
          calories: totals?.totalCalories || 0,
          carbs: totals?.totalCarbs || 0,
          protein: totals?.totalProtein || 0,
          fats: totals?.totalFats || 0
        };

        // Step 4: build the prompt
        const { message } = req.body;

        const genderText = user.gender === 0 ? 'male' : 'female';

        let prompt = `User profile: ${user.age} years old, ${genderText}, ${user.height}cm, ${user.current_weight}kg, goal weight ${user.goal_weight}kg, activity level: ${user.activity_level}.

        Daily targets: ${goalCalories} kcal, ${goalCarbs}g carbs, ${goalProtein}g protein, ${goalFat}g fat.

        Eaten so far today: ${eaten.calories} kcal, ${eaten.carbs}g carbs, ${eaten.protein}g protein, ${eaten.fats}g fat.

        Remaining budget: ${goalCalories - eaten.calories} kcal, ${goalCarbs - eaten.carbs}g carbs, ${goalProtein - eaten.protein}g protein, ${goalFat - eaten.fats}g fat.

        Formatting rules: you're replying inside a small ~340px wide chat widget. Never use Markdown tables. Prefer short plain sentences or a brief bullet list (max 3-5 bullets) over dense formatting. Avoid code blocks.`;

        if (message) {
          prompt += `

        The user specifically asks: "${message}"

        Answer their question directly, using the nutrition data above as context.`;
        } else {
          prompt += `

        Suggest 2-3 specific food or meal options to help the user hit their remaining targets for the rest of the day. Be concise and practical.`;
        }

        // Step 5: call Groq
        fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [
              { role: 'system', content: 'You are a helpful, concise nutrition assistant inside a food-tracking app.' },
              { role: 'user', content: prompt }
            ]
          })
        })
          .then(response => response.json())
          .then(data => {
            const aiMessage = data.choices[0].message.content;
            res.status(200).json({ recommendation: aiMessage });
          })
          .catch(err => {
            console.error('Groq API error:', err);
            res.status(500).json({ error: 'AI service error' });
          });
      });
    }
  );
});